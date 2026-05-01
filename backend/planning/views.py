from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from datetime import date, timedelta

from .models import Motif, PlanningEntry, HistoriqueModification
from .serializers import (
    MotifSerializer, PlanningEntrySerializer,
    PlanningBulkEntrySerializer, HistoriqueSerializer
)
from teams.models import Collaborateur
from accounts.permissions import IsAdmin, IsManager, IsAdminOrReadOnly


class MotifListView(generics.ListCreateAPIView):
    queryset = Motif.objects.all()
    serializer_class = MotifSerializer
    permission_classes = [IsAdminOrReadOnly]


class MotifDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Motif.objects.all()
    serializer_class = MotifSerializer
    permission_classes = [IsAdmin]


class PlanningListView(generics.ListAPIView):
    """
    Retourne les entrées de planning avec filtres :
    - region, equipe, collaborateur
    - date_debut, date_fin (obligatoires)
    """
    serializer_class = PlanningEntrySerializer

    def get_queryset(self):
        qs = PlanningEntry.objects.select_related(
            'collaborateur', 'collaborateur__equipe', 'collaborateur__equipe__region',
            'motif', 'created_by'
        )

        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')
        region = self.request.query_params.get('region')
        equipe = self.request.query_params.get('equipe')
        collaborateur_id = self.request.query_params.get('collaborateur')

        if date_debut:
            qs = qs.filter(jour__gte=date_debut)
        if date_fin:
            qs = qs.filter(jour__lte=date_fin)

        # Un collaborateur standard ne voit que son propre planning
        user = self.request.user
        if not user.is_manager:
            try:
                qs = qs.filter(collaborateur=user.collaborateur)
            except Exception:
                return PlanningEntry.objects.none()
        else:
            if region:
                qs = qs.filter(collaborateur__region_id=region)
            if equipe:
                qs = qs.filter(collaborateur__equipe_id=equipe)
            if collaborateur_id:
                qs = qs.filter(collaborateur_id=collaborateur_id)

        return qs


class PlanningEntryCreateView(APIView):
    """Crée ou met à jour une entrée planning (upsert)."""

    def post(self, request):
        # First check if entry already exists to determine the path
        collab_id    = request.data.get('collaborateur')
        jour         = request.data.get('jour')
        demi_journee = request.data.get('demi_journee')

        existing = None
        if collab_id and jour and demi_journee:
            existing = PlanningEntry.objects.filter(
                collaborateur_id=collab_id,
                jour=jour,
                demi_journee=demi_journee,
            ).first()

        # Pass is_upsert_update so serializer skips date validation on UPDATE path
        ctx = {'request': request, 'is_upsert_update': bool(existing)}
        serializer = PlanningEntrySerializer(data=request.data, context=ctx)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            if existing:
                ancien_motif = existing.motif
                existing.motif = data['motif']
                existing.updated_by = request.user
                existing.save()
                entry   = existing
                created = False
                action  = 'UPDATE'
            else:
                entry = PlanningEntry.objects.create(
                    collaborateur=data['collaborateur'],
                    jour=data['jour'],
                    demi_journee=data['demi_journee'],
                    motif=data['motif'],
                    created_by=request.user,
                    updated_by=request.user,
                )
                ancien_motif = None
                created = True
                action  = 'CREATE'

            HistoriqueModification.objects.create(
                planning_entry=entry,
                collaborateur=data['collaborateur'],
                jour=data['jour'],
                demi_journee=data['demi_journee'],
                ancien_motif=ancien_motif,
                nouveau_motif=data['motif'],
                action=action,
                auteur=request.user,
            )

        return Response(
            PlanningEntrySerializer(entry, context={'request': request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class PlanningEntryDeleteView(APIView):
    """Supprime une entrée planning avec historique."""

    def delete(self, request, pk):
        entry = get_object_or_404(PlanningEntry, pk=pk)

        # Vérification droits
        if not request.user.is_manager:
            try:
                if entry.collaborateur != request.user.collaborateur:
                    return Response(status=status.HTTP_403_FORBIDDEN)
            except Exception:
                return Response(status=status.HTTP_403_FORBIDDEN)
            if entry.jour < date.today():
                return Response(
                    {'detail': 'Impossible de supprimer un jour passé.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        with transaction.atomic():
            HistoriqueModification.objects.create(
                planning_entry=None,
                collaborateur=entry.collaborateur,
                jour=entry.jour,
                demi_journee=entry.demi_journee,
                ancien_motif=entry.motif,
                nouveau_motif=None,
                action='DELETE',
                auteur=request.user,
            )
            entry.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class PlanningBulkCreateView(APIView):
    """
    Saisie en masse : un motif sur plusieurs jours/demi-journées.
    """

    def post(self, request):
        serializer = PlanningBulkEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        collab = get_object_or_404(Collaborateur, pk=data['collaborateur_id'])
        motif = get_object_or_404(Motif, pk=data['motif_id'])

        # Vérification droits
        if not request.user.is_manager:
            try:
                if collab != request.user.collaborateur:
                    return Response(status=status.HTTP_403_FORBIDDEN)
            except Exception:
                return Response(status=status.HTTP_403_FORBIDDEN)
            if not motif.visible_collaborateur:
                return Response(
                    {'detail': 'Motif non autorisé.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        created_entries = []
        with transaction.atomic():
            for slot in data['jours']:
                jour = slot.get('jour')
                demi_journee = slot.get('demi_journee')
                if not jour or not demi_journee:
                    continue

                entry, created = PlanningEntry.objects.get_or_create(
                    collaborateur=collab,
                    jour=jour,
                    demi_journee=demi_journee,
                    defaults={'motif': motif, 'created_by': request.user, 'updated_by': request.user}
                )
                if not created:
                    ancien = entry.motif
                    entry.motif = motif
                    entry.updated_by = request.user
                    entry.save()
                    action = 'UPDATE'
                else:
                    ancien = None
                    action = 'CREATE'

                HistoriqueModification.objects.create(
                    planning_entry=entry,
                    collaborateur=collab,
                    jour=jour,
                    demi_journee=demi_journee,
                    ancien_motif=ancien,
                    nouveau_motif=motif,
                    action=action,
                    auteur=request.user,
                )
                created_entries.append(entry)

        return Response(
            PlanningEntrySerializer(created_entries, many=True, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class HistoriqueListView(generics.ListAPIView):
    serializer_class = HistoriqueSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        qs = HistoriqueModification.objects.select_related(
            'collaborateur', 'ancien_motif', 'nouveau_motif', 'auteur'
        )
        collab = self.request.query_params.get('collaborateur')
        if collab:
            qs = qs.filter(collaborateur_id=collab)
        return qs
