from django.urls import path
from .views import JourFerieListCreateView, JourFerieDetailView

urlpatterns = [
    path('jours-feries/', JourFerieListCreateView.as_view(), name='jour-ferie-list'),
    path('jours-feries/<int:pk>/', JourFerieDetailView.as_view(), name='jour-ferie-detail'),
]
