from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import models as django_models
from django.shortcuts import get_object_or_404

from .models import Region, Domaine, Equipe, Collaborateur, AffectationCollaborateur
from .serializers import (
    RegionSerializer, DomaineSerializer, EquipeSerializer,
    CollaborateurListSerializer, CollaborateurDetailSerializer,
    AffectationSerializer, ChangerEquipeSerializer,
)
from .services import changer_equipe, creer_collaborateur, desactiver_collaborateur
from accounts.permissions import IsAdmin, IsManager, IsAdminOrReadOnly


class RegionListView(generics.ListCreateAPIView):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    permission_classes = [IsAdminOrReadOnly]


class RegionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    permission_classes = [IsAdmin]


class DomaineListView(generics.ListAPIView):
    queryset = Domaine.objects.all()
    serializer_class = DomaineSerializer


class EquipeListCreateView(generics.ListCreateAPIView):
    serializer_class = EquipeSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = Equipe.objects.select_related('region', 'domaine')
        region = self.request.query_params.get('region')
        domaine = self.request.query_params.get('domaine')
        if region:
            qs = qs.filter(region_id=region)
        if domaine:
            qs = qs.filter(domaine_id=domaine)
        if self.request.query_params.get('active', 'true').lower() == 'true':
            qs = qs.filter(active=True)
        return qs


class EquipeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Equipe.objects.all()
    serializer_class = EquipeSerializer
    permission_classes = [IsAdmin]

    def perform_destroy(self, instance):
        instance.active = False
        instance.save()


class CollaborateurListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsManager]

    def get_serializer_class(self):
        return CollaborateurDetailSerializer if self.request.method == 'POST' else CollaborateurListSerializer

    def get_queryset(self):
        qs = Collaborateur.objects.select_related('equipe', 'equipe__region', 'user')
        region = self.request.query_params.get('region')
        equipe = self.request.query_params.get('equipe')
        search = self.request.query_params.get('search')
        if self.request.query_params.get('actif', 'true').lower() == 'true':
            qs = qs.filter(actif=True)
        # Filtrer par région via equipe__region (plus de region_id direct sur Collaborateur)
        if region:
            qs = qs.filter(equipe__region_id=region)
        if equipe:
            qs = qs.filter(equipe_id=equipe)
        if search:
            qs = qs.filter(
                django_models.Q(nom__icontains=search) |
                django_models.Q(prenom__icontains=search) |
                django_models.Q(matricule__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        """Passe par le service pour initialiser l'historique d'affectation."""
        data = serializer.validated_data
        creer_collaborateur(
            matricule=data['matricule'],
            nom=data['nom'],
            prenom=data['prenom'],
            equipe=data.get('equipe'),
            date_entree=data['date_entree'],
            user=data.get('user'),
        )


class CollaborateurDetailView(generics.RetrieveUpdateAPIView):
    queryset = Collaborateur.objects.select_related('equipe', 'equipe__region', 'user').prefetch_related('affectations__equipe__region')
    serializer_class = CollaborateurDetailSerializer
    permission_classes = [IsManager]

    def perform_update(self, serializer):
        instance = serializer.save()
        # Départ : fermer l'affectation courante via le service
        if instance.date_sortie and instance.actif:
            desactiver_collaborateur(instance, instance.date_sortie)


class ChangerEquipeView(APIView):
    """
    Endpoint dédié au changement d'équipe d'un collaborateur.
    Passe obligatoirement par le service pour maintenir la cohérence
    entre Collaborateur.equipe et AffectationCollaborateur.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        collaborateur = get_object_or_404(Collaborateur, pk=pk)
        serializer = ChangerEquipeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        nouvelle_equipe = get_object_or_404(Equipe, pk=serializer.validated_data['equipe_id'])
        date_debut = serializer.validated_data['date_debut']

        try:
            affectation = changer_equipe(collaborateur, nouvelle_equipe, date_debut)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(AffectationSerializer(affectation).data, status=status.HTTP_200_OK)


class AffectationHistoriqueView(generics.ListAPIView):
    """Historique complet des affectations d'un collaborateur."""
    serializer_class = AffectationSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        return AffectationCollaborateur.objects.filter(
            collaborateur_id=self.kwargs['pk']
        ).select_related('equipe', 'equipe__region').order_by('-date_debut')
