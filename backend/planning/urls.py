from django.urls import path
from .views import (
    MotifListView, MotifDetailView,
    PlanningListView, PlanningEntryCreateView,
    PlanningEntryDeleteView, PlanningBulkCreateView,
    HistoriqueListView,
)

urlpatterns = [
    path('motifs/', MotifListView.as_view(), name='motif-list'),
    path('motifs/<int:pk>/', MotifDetailView.as_view(), name='motif-detail'),
    path('planning/', PlanningListView.as_view(), name='planning-list'),
    path('planning/entry/', PlanningEntryCreateView.as_view(), name='planning-entry-create'),
    path('planning/entry/<int:pk>/', PlanningEntryDeleteView.as_view(), name='planning-entry-delete'),
    path('planning/bulk/', PlanningBulkCreateView.as_view(), name='planning-bulk'),
    path('planning/historique/', HistoriqueListView.as_view(), name='planning-historique'),
]
