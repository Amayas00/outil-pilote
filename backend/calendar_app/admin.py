from django.contrib import admin
from .models import JourFerie

@admin.register(JourFerie)
class JourFerieAdmin(admin.ModelAdmin):
    list_display = ['jour', 'libelle', 'type']
    list_filter = ['type']
