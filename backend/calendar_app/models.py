from django.db import models
from teams.models import Region


class JourFerie(models.Model):
    TYPE_CHOICES = [
        ('ferie', 'Jour férié'),
        ('pont', 'Pont'),
    ]

    jour = models.DateField()
    libelle = models.CharField(max_length=150)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='ferie')
    regions = models.ManyToManyField(
        Region,
        through='JourFerieRegion',
        blank=True,
        help_text="Laisser vide pour appliquer à toutes les régions."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'jour férié / pont'
        ordering = ['jour']

    def __str__(self):
        return f"{self.jour} - {self.libelle} ({self.get_type_display()})"


class JourFerieRegion(models.Model):
    jour_ferie = models.ForeignKey(JourFerie, on_delete=models.CASCADE)
    region = models.ForeignKey(Region, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['jour_ferie', 'region']
