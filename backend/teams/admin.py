from django.contrib import admin
from .models import Region, Domaine, Equipe, Collaborateur, AffectationCollaborateur

admin.site.register(Region)
admin.site.register(Domaine)

@admin.register(Equipe)
class EquipeAdmin(admin.ModelAdmin):
    list_display = ['nom', 'region', 'domaine', 'active']
    list_filter = ['region', 'domaine', 'active']


class AffectationInline(admin.TabularInline):
    model = AffectationCollaborateur
    extra = 0
    readonly_fields = ['date_debut', 'date_fin', 'equipe']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False  # Toujours passer par le service


@admin.register(Collaborateur)
class CollaborateurAdmin(admin.ModelAdmin):
    list_display = ['matricule', 'nom', 'prenom', 'equipe', 'get_region', 'actif']
    list_filter = ['equipe__region', 'equipe', 'actif']
    search_fields = ['matricule', 'nom', 'prenom']
    inlines = [AffectationInline]
    readonly_fields = ['created_at', 'updated_at']

    @admin.display(description='Région')
    def get_region(self, obj):
        return obj.equipe.region.nom if obj.equipe else '—'


@admin.register(AffectationCollaborateur)
class AffectationAdmin(admin.ModelAdmin):
    list_display = ['collaborateur', 'equipe', 'date_debut', 'date_fin']
    list_filter = ['equipe__region', 'equipe']
    raw_id_fields = ['collaborateur']
