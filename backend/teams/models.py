from django.db import models
from django.db.models import Q, F
from django.core.exceptions import ValidationError
from accounts.models import User


class Region(models.Model):
    nom = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = 'région'
        ordering = ['nom']

    def __str__(self):
        return self.nom


class Domaine(models.Model):
    DOMAINES = [
        ('automobile', 'Automobile'),
        ('construction', 'Construction'),
        ('rc', 'Responsabilité Civile'),
        ('dommages', 'Dommages'),
        ('immeuble', 'Immeuble'),
    ]
    nom = models.CharField(max_length=50, choices=DOMAINES, unique=True)

    class Meta:
        verbose_name = 'domaine'
        ordering = ['nom']

    def __str__(self):
        return self.get_nom_display()


class Equipe(models.Model):
    nom = models.CharField(max_length=150)
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name='equipes')
    domaine = models.ForeignKey(Domaine, on_delete=models.PROTECT, related_name='equipes')
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'équipe'
        ordering = ['region', 'nom']
        constraints = [
            models.UniqueConstraint(
                fields=['nom', 'region', 'domaine'],
                name='equipe_unique_nom_region_domaine'
            )
        ]
        indexes = [
            models.Index(fields=['region', 'active'], name='idx_equipe_region_active'),
        ]

    def __str__(self):
        return f"{self.nom} ({self.region} - {self.domaine})"


class Collaborateur(models.Model):
    """
    Représente une personne dans l'organigramme RH.
    Le rôle (droits d'accès) est porté uniquement par User.role.
    La région est déduite via equipe.region — pas de duplication.
    equipe est un champ dénormalisé pour la lecture rapide (équipe courante) ;
    la vérité historique vit dans AffectationCollaborateur.
    """
    matricule = models.CharField(max_length=20, unique=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    # Dénormalisation délibérée : équipe courante pour accès O(1).
    # Toute modification doit passer par services.changer_equipe().
    equipe = models.ForeignKey(
        Equipe, on_delete=models.PROTECT,
        related_name='collaborateurs', null=True, blank=True
    )
    date_entree = models.DateField()
    date_sortie = models.DateField(null=True, blank=True)
    actif = models.BooleanField(default=True)
    user = models.OneToOneField(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='collaborateur'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'collaborateur'
        ordering = ['nom', 'prenom']
        constraints = [
            models.CheckConstraint(
                condition=Q(date_sortie__isnull=True) | Q(date_sortie__gt=F('date_entree')),
                name='collaborateur_dates_coherentes'
            )
        ]
        indexes = [
            models.Index(fields=['equipe', 'actif'], name='idx_collab_equipe_actif'),
            models.Index(fields=['user'], name='idx_collab_user'),
        ]

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.matricule})"

    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}"

    @property
    def region(self):
        """La région est déduite de l'équipe courante."""
        return self.equipe.region if self.equipe else None

    def clean(self):
        if self.date_sortie and self.date_entree and self.date_sortie <= self.date_entree:
            raise ValidationError(
                {'date_sortie': "La date de sortie doit être postérieure à la date d'entrée."}
            )


class AffectationCollaborateur(models.Model):
    """
    Historique des affectations d'un collaborateur à une équipe.
    - date_fin NULL = affectation courante.
    - Une seule affectation courante par collaborateur (UniqueConstraint partielle).
    - Toute modification passe par services.changer_equipe() pour garantir la cohérence
      avec Collaborateur.equipe (le champ dénormalisé).
    """
    collaborateur = models.ForeignKey(
        Collaborateur, on_delete=models.CASCADE,
        related_name='affectations'
    )
    equipe = models.ForeignKey(
        Equipe, on_delete=models.PROTECT,
        related_name='affectations'
    )
    date_debut = models.DateField()
    date_fin = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = 'affectation collaborateur'
        ordering = ['collaborateur', '-date_debut']
        constraints = [
            # date_fin > date_debut si renseignée
            models.CheckConstraint(
                condition=Q(date_fin__isnull=True) | Q(date_fin__gt=F('date_debut')),
                name='affectation_dates_coherentes'
            ),
            # Une seule affectation courante par collaborateur
            models.UniqueConstraint(
                fields=['collaborateur'],
                condition=Q(date_fin__isnull=True),
                name='affectation_unique_courante'
            ),
        ]
        indexes = [
            # Couverture des deux requêtes principales :
            # "affectation courante" et "historique chronologique"
            models.Index(
                fields=['collaborateur', 'date_debut'],
                name='idx_affectation_collab_debut'
            ),
        ]

    def __str__(self):
        fin = self.date_fin or 'en cours'
        return f"{self.collaborateur} → {self.equipe} ({self.date_debut} / {fin})"

    def clean(self):
        if self.date_fin and self.date_debut and self.date_fin <= self.date_debut:
            raise ValidationError(
                {'date_fin': "La date de fin doit être postérieure à la date de début."}
            )
