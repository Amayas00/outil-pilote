"""
Tests de gestion des équipes et collaborateurs.
Couvre les contraintes de données, la cohérence
des affectations et les permissions CRUD.
"""
import pytest
from datetime import date, timedelta
from django.db import IntegrityError

from teams.models import Collaborateur, AffectationCollaborateur
from teams.services import changer_equipe, creer_collaborateur, desactiver_collaborateur


# ── Modèle Collaborateur ──────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCollaborateurModel:

    def test_matricule_is_unique(self, collaborateur, equipe):
        with pytest.raises(IntegrityError):
            Collaborateur.objects.create(
                matricule='EMP-001',  # même matricule
                nom='Autre', prenom='Collab',
                equipe=equipe, date_entree=date(2024, 1, 1),
            )

    def test_region_property_derives_from_equipe(self, collaborateur, region):
        """La région d'un collaborateur est déduite de son équipe."""
        assert collaborateur.region == region

    def test_region_is_none_without_equipe(self, db, equipe):
        c = Collaborateur.objects.create(
            matricule='EMP-NO-EQUIPE', nom='Test', prenom='Test',
            equipe=None, date_entree=date(2024, 1, 1),
        )
        assert c.region is None

    def test_nom_complet_property(self, collaborateur):
        assert collaborateur.nom_complet == 'Jean Dupont'

    def test_date_sortie_check_constraint(self, db, equipe):
        """date_sortie doit être postérieure à date_entree — enforced en BDD."""
        with pytest.raises(Exception):  # IntegrityError ou ValidationError selon la BDD
            c = Collaborateur(
                matricule='EMP-BAD', nom='Bad', prenom='Dates',
                equipe=equipe,
                date_entree=date(2024, 6, 1),
                date_sortie=date(2024, 1, 1),  # antérieure !
            )
            c.full_clean()


# ── Service changer_equipe ────────────────────────────────────────────────────

@pytest.mark.django_db
class TestChangerEquipeService:

    def test_changes_current_equipe(self, collaborateur, equipe2):
        changer_equipe(collaborateur, equipe2, date.today())
        collaborateur.refresh_from_db()
        assert collaborateur.equipe == equipe2

    def test_closes_previous_affectation(self, collaborateur, equipe2):
        today = date.today()
        changer_equipe(collaborateur, equipe2, today)

        old = AffectationCollaborateur.objects.filter(
            collaborateur=collaborateur, equipe=collaborateur.equipe
        ).order_by('date_debut').first()
        # L'ancienne affectation (equipe initiale) doit être fermée
        closed = AffectationCollaborateur.objects.filter(
            collaborateur=collaborateur, date_fin__isnull=False
        ).first()
        assert closed is not None
        assert closed.date_fin == today

    def test_creates_new_open_affectation(self, collaborateur, equipe2):
        changer_equipe(collaborateur, equipe2, date.today())
        current = AffectationCollaborateur.objects.get(
            collaborateur=collaborateur, date_fin__isnull=True
        )
        assert current.equipe == equipe2

    def test_only_one_current_affectation(self, collaborateur, equipe2):
        """La contrainte partielle UNIQUE(collab) WHERE date_fin IS NULL doit tenir."""
        changer_equipe(collaborateur, equipe2, date.today())
        count = AffectationCollaborateur.objects.filter(
            collaborateur=collaborateur, date_fin__isnull=True
        ).count()
        assert count == 1

    def test_raises_if_same_equipe(self, collaborateur):
        same = collaborateur.equipe
        with pytest.raises(Exception):
            changer_equipe(collaborateur, same, date.today())


# ── Service creer_collaborateur ───────────────────────────────────────────────

@pytest.mark.django_db
class TestCreerCollaborateurService:

    def test_creates_initial_affectation(self, equipe):
        c = creer_collaborateur(
            matricule='EMP-NEW', nom='Nouveau', prenom='Collab',
            equipe=equipe, date_entree=date(2024, 1, 1),
        )
        affectations = AffectationCollaborateur.objects.filter(collaborateur=c)
        assert affectations.count() == 1
        assert affectations.first().date_fin is None  # ouverte

    def test_affectation_date_matches_entree(self, equipe):
        entree = date(2024, 6, 15)
        c = creer_collaborateur(
            matricule='EMP-DATE', nom='Test', prenom='Date',
            equipe=equipe, date_entree=entree,
        )
        aff = AffectationCollaborateur.objects.get(collaborateur=c)
        assert aff.date_debut == entree


# ── Service desactiver_collaborateur ─────────────────────────────────────────

@pytest.mark.django_db
class TestDesactiverCollaborateurService:

    def test_sets_actif_false(self, collaborateur):
        desactiver_collaborateur(collaborateur, date.today())
        collaborateur.refresh_from_db()
        assert collaborateur.actif is False

    def test_sets_date_sortie(self, collaborateur):
        today = date.today()
        desactiver_collaborateur(collaborateur, today)
        collaborateur.refresh_from_db()
        assert collaborateur.date_sortie == today

    def test_closes_current_affectation(self, collaborateur):
        today = date.today()
        desactiver_collaborateur(collaborateur, today)
        open_aff = AffectationCollaborateur.objects.filter(
            collaborateur=collaborateur, date_fin__isnull=True
        )
        assert open_aff.count() == 0


# ── API Collaborateurs ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCollaborateursAPI:

    def test_admin_can_list_collaborateurs(self, admin_client, collaborateur):
        res = admin_client.get('/api/v1/collaborateurs/')
        assert res.status_code == 200

    def test_collab_cannot_list_collaborateurs(self, collab_client):
        res = collab_client.get('/api/v1/collaborateurs/')
        assert res.status_code == 403

    def test_admin_can_create_collaborateur(self, admin_client, equipe):
        res = admin_client.post('/api/v1/collaborateurs/', {
            'matricule': 'EMP-API',
            'nom': 'API',
            'prenom': 'Test',
            'equipe': equipe.id,
            'date_entree': '2024-01-01',
        }, format='json')
        assert res.status_code == 201
        assert Collaborateur.objects.filter(matricule='EMP-API').exists()

    def test_admin_can_deactivate_collaborateur(self, admin_client, collaborateur):
        res = admin_client.patch(f'/api/v1/collaborateurs/{collaborateur.id}/', {
            'actif': False,
            'date_sortie': str(date.today()),
        }, format='json')
        assert res.status_code == 200
        collaborateur.refresh_from_db()
        assert collaborateur.actif is False

    def test_changer_equipe_endpoint(self, admin_client, collaborateur, equipe2):
        res = admin_client.post(
            f'/api/v1/collaborateurs/{collaborateur.id}/changer-equipe/',
            {'equipe_id': equipe2.id, 'date_debut': str(date.today())},
            format='json'
        )
        assert res.status_code == 200
        collaborateur.refresh_from_db()
        assert collaborateur.equipe == equipe2

    def test_manager_cannot_access_changer_equipe(self, manager_client, collaborateur, equipe2):
        res = manager_client.post(
            f'/api/v1/collaborateurs/{collaborateur.id}/changer-equipe/',
            {'equipe_id': equipe2.id, 'date_debut': str(date.today())},
            format='json'
        )
        assert res.status_code == 403


# ── API Équipes ───────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestEquipesAPI:

    def test_anyone_can_list_equipes(self, collab_client, equipe):
        res = collab_client.get('/api/v1/equipes/')
        assert res.status_code == 200

    def test_admin_can_create_equipe(self, admin_client, region, domaine):
        res = admin_client.post('/api/v1/equipes/', {
            'nom': 'Nouvelle Équipe',
            'region': region.id,
            'domaine': domaine.id,
        }, format='json')
        assert res.status_code == 201

    def test_collab_cannot_create_equipe(self, collab_client, region, domaine):
        res = collab_client.post('/api/v1/equipes/', {
            'nom': 'Tentative',
            'region': region.id,
            'domaine': domaine.id,
        }, format='json')
        assert res.status_code == 403

    def test_soft_delete_equipe(self, admin_client, equipe):
        res = admin_client.delete(f'/api/v1/equipes/{equipe.id}/')
        assert res.status_code == 204
        equipe.refresh_from_db()
        assert equipe.active is False   # soft delete — toujours en BDD
