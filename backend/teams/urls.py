from django.urls import path
from .views import (
    RegionListView, RegionDetailView, DomaineListView,
    EquipeListCreateView, EquipeDetailView,
    CollaborateurListCreateView, CollaborateurDetailView,
    ChangerEquipeView, AffectationHistoriqueView,
)

urlpatterns = [
    path('regions/', RegionListView.as_view(), name='region-list'),
    path('regions/<int:pk>/', RegionDetailView.as_view(), name='region-detail'),
    path('domaines/', DomaineListView.as_view(), name='domaine-list'),
    path('equipes/', EquipeListCreateView.as_view(), name='equipe-list'),
    path('equipes/<int:pk>/', EquipeDetailView.as_view(), name='equipe-detail'),
    path('collaborateurs/', CollaborateurListCreateView.as_view(), name='collab-list'),
    path('collaborateurs/<int:pk>/', CollaborateurDetailView.as_view(), name='collab-detail'),
    # Endpoints dédiés à la gestion des affectations
    path('collaborateurs/<int:pk>/changer-equipe/', ChangerEquipeView.as_view(), name='collab-changer-equipe'),
    path('collaborateurs/<int:pk>/affectations/', AffectationHistoriqueView.as_view(), name='collab-affectations'),
]
