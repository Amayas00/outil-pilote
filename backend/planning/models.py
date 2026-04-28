from django.db import models
from django.db.models import Q, F
from django.core.exceptions import ValidationError
from teams.models import Collaborateur
from accounts.models import User


class Motif(models.Model):
    """
    Référentiel des motifs de planning.
    visible_collaborateur = False → seul un manager/admin peut saisir ce motif.
    """
    code = models.CharField(max_length=30, unique=True)
    libelle = models.CharField(max_length=100)
    couleur_hex = models.CharField(max_length=7, default='#CCCCCC')
    visible_collaborateur = models.BooleanField(
        default=True,
        help_text="Si coché, un collaborateur peut saisir ce motif lui-même."
    )
    ordre = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = 'motif'
        ordering = ['ordre', 'libelle']

    def __str__(self):
        return f"{self.code} - {self.libelle}"


class PlanningEntry(models.Model):
    """
    Entrée de planning : un collaborateur, un jour, une demi-journée, un motif.
    Contrainte métier centrale : UNIQUE(collaborateur, jour, demi_journee).
    """
    DEMI_JOURNEE_CHOICES = [
        ('AM', 'Matin'),
        ('PM', 'Après-midi'),
    ]

    collaborateur = models.ForeignKey(
        Collaborateur, on_delete=models.CASCADE,
        related_name='planning_entries'
    )
    jour = models.DateField()
    demi_journee = models.CharField(max_length=2, choices=DEMI_JOURNEE_CHOICES)
    motif = models.ForeignKey(
        Motif, on_delete=models.PROTECT, related_name='entries'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='entries_created'
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='entries_updated'
    )

    class Meta:
        verbose_name = 'entrée planning'
        ordering = ['jour', 'demi_journee', 'collaborateur']
        constraints = [
            # Contrainte métier principale : un seul motif par demi-journée par collaborateur.
            # Enforced à la fois ici (BDD) et dans le serializer (message d'erreur lisible).
            models.UniqueConstraint(
                fields=['collaborateur', 'jour', 'demi_journee'],
                name='planning_entry_unique_slot'
            )
        ]
        indexes = [
            # Requête principale : grille planning d'un collaborateur sur une période
            models.Index(
                fields=['collaborateur', 'jour'],
                name='idx_planning_collab_jour'
            ),
            # Agrégats / filtres par motif sur une période
            models.Index(
                fields=['jour', 'motif'],
                name='idx_planning_jour_motif'
            ),
        ]

    def __str__(self):
        return f"{self.collaborateur} - {self.jour} {self.demi_journee} - {self.motif.code}"


class HistoriqueModification(models.Model):
    """
    Trace immuable de chaque modification sur PlanningEntry.
    planning_entry est nullable avec SET_NULL : l'historique survit à la suppression
    d'une entrée (cas DELETE — l'entrée disparaît mais la trace reste).
    collaborateur + jour + demi_journee sont dénormalisés ici pour cette raison.
    """
    ACTION_CHOICES = [
        ('CREATE', 'Création'),
        ('UPDATE', 'Modification'),
        ('DELETE', 'Suppression'),
    ]

    # SET_NULL intentionnel : on conserve l'historique même si l'entrée est supprimée
    planning_entry = models.ForeignKey(
        PlanningEntry, on_delete=models.SET_NULL,
        related_name='historique', null=True, blank=True
    )
    collaborateur = models.ForeignKey(
        Collaborateur, on_delete=models.CASCADE,
        related_name='historique_modifications'
    )
    jour = models.DateField()
    demi_journee = models.CharField(max_length=2, choices=PlanningEntry.DEMI_JOURNEE_CHOICES)
    ancien_motif = models.ForeignKey(
        Motif, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='historique_ancien'
    )
    nouveau_motif = models.ForeignKey(
        Motif, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='historique_nouveau'
    )
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    auteur = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='modifications_effectuees'
    )
    date_modif = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'historique modification'
        ordering = ['-date_modif']
        indexes = [
            # Audit trail : historique d'un collaborateur trié par date
            models.Index(
                fields=['collaborateur', 'date_modif'],
                name='idx_historique_collab_date'
            ),
        ]

    def __str__(self):
        return f"{self.action} - {self.collaborateur} - {self.jour} {self.demi_journee}"
