"""
Services métier pour la gestion des collaborateurs.

Toute modification d'équipe DOIT passer par changer_equipe() pour garantir
la cohérence entre :
  - Collaborateur.equipe  (champ dénormalisé — lecture rapide)
  - AffectationCollaborateur  (source de vérité historique)

Ne jamais écrire directement collaborateur.equipe = ... sans appeler ce service.
"""
from datetime import date
from django.db import transaction
from django.core.exceptions import ValidationError
from django.db import models as django_models
from .models import Collaborateur, Equipe, AffectationCollaborateur


def changer_equipe(collaborateur: Collaborateur, nouvelle_equipe: Equipe, date_debut: date) -> AffectationCollaborateur:
    """
    Transfère un collaborateur vers une nouvelle équipe à partir de date_debut.

    Actions effectuées dans une transaction atomique :
    1. Ferme l'affectation courante (date_fin = date_debut)
    2. Crée une nouvelle affectation ouverte
    3. Met à jour le champ dénormalisé Collaborateur.equipe

    Retourne la nouvelle AffectationCollaborateur créée.
    """
    if collaborateur.equipe == nouvelle_equipe:
        raise ValidationError("Le collaborateur est déjà dans cette équipe.")

    with transaction.atomic():
        # Fermer l'affectation courante si elle existe
        AffectationCollaborateur.objects.filter(
            collaborateur=collaborateur,
            date_fin__isnull=True
        ).update(date_fin=date_debut)

        # Ouvrir la nouvelle affectation
        nouvelle_affectation = AffectationCollaborateur.objects.create(
            collaborateur=collaborateur,
            equipe=nouvelle_equipe,
            date_debut=date_debut,
            date_fin=None,
        )

        # Mettre à jour le champ dénormalisé
        collaborateur.equipe = nouvelle_equipe
        collaborateur.save(update_fields=['equipe', 'updated_at'])

    return nouvelle_affectation


def creer_collaborateur(
    matricule: str, nom: str, prenom: str,
    equipe: Equipe, date_entree: date,
    user=None
) -> Collaborateur:
    """
    Crée un collaborateur et initialise son historique d'affectation.
    Point d'entrée canonique pour tout nouvel arrivant.
    """
    with transaction.atomic():
        collaborateur = Collaborateur.objects.create(
            matricule=matricule,
            nom=nom,
            prenom=prenom,
            equipe=equipe,
            date_entree=date_entree,
            actif=True,
            user=user,
        )
        # Initialiser l'historique d'affectation
        AffectationCollaborateur.objects.create(
            collaborateur=collaborateur,
            equipe=equipe,
            date_debut=date_entree,
            date_fin=None,
        )

    return collaborateur


def desactiver_collaborateur(collaborateur: Collaborateur, date_sortie: date) -> Collaborateur:
    """
    Gère le départ d'un collaborateur :
    - Renseigne la date de sortie
    - Désactive le compte
    - Ferme l'affectation courante
    L'historique planning est conservé intégralement.
    """
    with transaction.atomic():
        AffectationCollaborateur.objects.filter(
            collaborateur=collaborateur,
            date_fin__isnull=True
        ).update(date_fin=date_sortie)

        collaborateur.date_sortie = date_sortie
        collaborateur.actif = False
        collaborateur.save(update_fields=['date_sortie', 'actif', 'updated_at'])

    return collaborateur


def get_affectation_a_date(collaborateur: Collaborateur, date_ref: date):
    """
    Retourne l'équipe d'un collaborateur à une date donnée.
    Utile pour les requêtes historiques sur le planning.
    """
    return AffectationCollaborateur.objects.filter(
        collaborateur=collaborateur,
        date_debut__lte=date_ref,
    ).filter(
        django_models.Q(date_fin__isnull=True) | models.Q(date_fin__gt=date_ref)
    ).select_related('equipe', 'equipe__region').first()
