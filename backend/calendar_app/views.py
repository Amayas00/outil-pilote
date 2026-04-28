from rest_framework import generics
from .models import JourFerie
from .serializers import JourFerieSerializer
from accounts.permissions import IsAdmin, IsAdminOrReadOnly


class JourFerieListCreateView(generics.ListCreateAPIView):
    serializer_class = JourFerieSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = JourFerie.objects.prefetch_related('regions')
        annee = self.request.query_params.get('annee')
        region = self.request.query_params.get('region')
        type_j = self.request.query_params.get('type')

        if annee:
            qs = qs.filter(jour__year=annee)
        if type_j:
            qs = qs.filter(type=type_j)
        if region:
            # Retourner les jours qui concernent cette région OU toutes les régions
            from django.db.models import Q
            qs = qs.filter(
                Q(regions__id=region) | Q(regions__isnull=True)
            ).distinct()
        return qs


class JourFerieDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = JourFerie.objects.prefetch_related('regions')
    serializer_class = JourFerieSerializer
    permission_classes = [IsAdmin]
