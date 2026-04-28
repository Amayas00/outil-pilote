from django.contrib import admin
from .models import Motif, PlanningEntry, HistoriqueModification

@admin.register(Motif)
class MotifAdmin(admin.ModelAdmin):
    list_display = ['code', 'libelle', 'couleur_hex', 'visible_collaborateur', 'ordre']

@admin.register(PlanningEntry)
class PlanningEntryAdmin(admin.ModelAdmin):
    list_display = ['collaborateur', 'jour', 'demi_journee', 'motif']
    list_filter = ['demi_journee', 'motif', 'jour']

@admin.register(HistoriqueModification)
class HistoriqueAdmin(admin.ModelAdmin):
    list_display = ['collaborateur', 'jour', 'demi_journee', 'action', 'auteur', 'date_modif']
    list_filter = ['action']
