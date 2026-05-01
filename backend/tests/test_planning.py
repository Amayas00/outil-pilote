"""
Tests des règles métier du planning.
Couvre la contrainte unique, les permissions par rôle,
les restrictions de date, et la traçabilité historique.
"""
import pytest
from datetime import date, timedelta
from django.db import IntegrityError

from planning.models import PlanningEntry, HistoriqueModification


FUTURE = date.today() + timedelta(days=7)
PAST   = date.today() - timedelta(days=7)


# ── Contrainte unique ─────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPlanningUniqueConstraint:

    def test_same_slot_raises_integrity_error(self, collaborateur, motif_conge, admin_user):
        """Deux entrées sur le même collab/jour/demi-journée doivent échouer en BDD."""
        PlanningEntry.objects.create(
            collaborateur=collaborateur, jour=FUTURE,
            demi_journee='AM', motif=motif_conge,
            created_by=admin_user, updated_by=admin_user,
        )
        with pytest.raises(IntegrityError):
            PlanningEntry.objects.create(
                collaborateur=collaborateur, jour=FUTURE,
                demi_journee='AM', motif=motif_conge,
                created_by=admin_user, updated_by=admin_user,
            )

    def test_different_half_day_is_allowed(self, collaborateur, motif_conge, admin_user):
        """AM et PM le même jour pour le même collab = deux entrées valides."""
        PlanningEntry.objects.create(
            collaborateur=collaborateur, jour=FUTURE,
            demi_journee='AM', motif=motif_conge,
            created_by=admin_user, updated_by=admin_user,
        )
        entry_pm = PlanningEntry.objects.create(
            collaborateur=collaborateur, jour=FUTURE,
            demi_journee='PM', motif=motif_conge,
            created_by=admin_user, updated_by=admin_user,
        )
        assert entry_pm.pk is not None

    def test_same_slot_different_collab_is_allowed(
        self, collaborateur, collaborateur2, motif_conge, admin_user
    ):
        """Deux collaborateurs différents peuvent avoir le même slot."""
        PlanningEntry.objects.create(
            collaborateur=collaborateur, jour=FUTURE,
            demi_journee='AM', motif=motif_conge,
            created_by=admin_user, updated_by=admin_user,
        )
        entry2 = PlanningEntry.objects.create(
            collaborateur=collaborateur2, jour=FUTURE,
            demi_journee='AM', motif=motif_conge,
            created_by=admin_user, updated_by=admin_user,
        )
        assert entry2.pk is not None


# ── API upsert (POST /planning/entry/) ───────────────────────────────────────

@pytest.mark.django_db
class TestPlanningUpsert:

    def test_admin_can_create_entry(self, admin_client, collaborateur, motif_conge):
        res = admin_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur.id,
            'jour': str(FUTURE),
            'demi_journee': 'AM',
            'motif': motif_conge.id,
        }, format='json')
        assert res.status_code == 201
        assert PlanningEntry.objects.filter(
            collaborateur=collaborateur, jour=FUTURE, demi_journee='AM'
        ).exists()

    def test_upsert_updates_existing_entry(
        self, admin_client, collaborateur, motif_conge, motif_maladie, admin_user
    ):
        """Un deuxième POST sur le même slot met à jour le motif (upsert)."""
        PlanningEntry.objects.create(
            collaborateur=collaborateur, jour=FUTURE, demi_journee='AM',
            motif=motif_conge, created_by=admin_user, updated_by=admin_user,
        )
        res = admin_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur.id,
            'jour': str(FUTURE),
            'demi_journee': 'AM',
            'motif': motif_maladie.id,
        }, format='json')
        assert res.status_code == 200
        entry = PlanningEntry.objects.get(
            collaborateur=collaborateur, jour=FUTURE, demi_journee='AM'
        )
        assert entry.motif == motif_maladie

    def test_manager_can_create_entry_for_any_collab(
        self, manager_client, collaborateur, motif_conge
    ):
        res = manager_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur.id,
            'jour': str(FUTURE),
            'demi_journee': 'PM',
            'motif': motif_conge.id,
        }, format='json')
        assert res.status_code == 201

    def test_unauthenticated_cannot_create_entry(self, api_client, collaborateur, motif_conge):
        res = api_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur.id,
            'jour': str(FUTURE),
            'demi_journee': 'AM',
            'motif': motif_conge.id,
        }, format='json')
        assert res.status_code == 401


# ── Règles collaborateur ──────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCollaborateurPlanningRules:

    def test_collab_can_create_own_future_entry(
        self, collab_client, collaborateur, motif_conge
    ):
        """Un collaborateur peut saisir ses propres jours futurs."""
        res = collab_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur.id,
            'jour': str(FUTURE),
            'demi_journee': 'AM',
            'motif': motif_conge.id,
        }, format='json')
        assert res.status_code == 201

    def test_collab_cannot_create_past_entry(
        self, collab_client, collaborateur, motif_conge
    ):
        """Un collaborateur ne peut pas saisir des jours passés."""
        res = collab_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur.id,
            'jour': str(PAST),
            'demi_journee': 'AM',
            'motif': motif_conge.id,
        }, format='json')
        assert res.status_code == 400

    def test_collab_cannot_use_restricted_motif(
        self, collab_client, collaborateur, motif_mission
    ):
        """Un collaborateur ne peut pas utiliser un motif non autorisé (visible_collaborateur=False)."""
        res = collab_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur.id,
            'jour': str(FUTURE),
            'demi_journee': 'AM',
            'motif': motif_mission.id,
        }, format='json')
        assert res.status_code == 400

    def test_collab_cannot_create_entry_for_other_collab(
        self, collab_client, collaborateur2, motif_conge
    ):
        """Un collaborateur ne peut pas modifier le planning d'un autre."""
        res = collab_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur2.id,
            'jour': str(FUTURE),
            'demi_journee': 'AM',
            'motif': motif_conge.id,
        }, format='json')
        assert res.status_code == 400

    def test_manager_can_use_restricted_motif(
        self, manager_client, collaborateur, motif_mission
    ):
        """Un manager peut utiliser tous les motifs, y compris restreints."""
        res = manager_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur.id,
            'jour': str(FUTURE),
            'demi_journee': 'AM',
            'motif': motif_mission.id,
        }, format='json')
        assert res.status_code == 201

    def test_manager_can_create_past_entry(
        self, manager_client, collaborateur, motif_conge
    ):
        """Un manager peut saisir des jours passés."""
        res = manager_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur.id,
            'jour': str(PAST),
            'demi_journee': 'AM',
            'motif': motif_conge.id,
        }, format='json')
        assert res.status_code == 201


# ── Suppression ───────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPlanningDelete:

    def test_admin_can_delete_entry(self, admin_client, entry_today, admin_user):
        entry_id = entry_today.id
        res = admin_client.delete(f'/api/v1/planning/entry/{entry_id}/')
        assert res.status_code == 204
        assert not PlanningEntry.objects.filter(pk=entry_id).exists()

    def test_collab_cannot_delete_past_entry(
        self, collab_client, collaborateur, motif_conge, admin_user
    ):
        """Un collaborateur ne peut pas supprimer un jour passé."""
        past_entry = PlanningEntry.objects.create(
            collaborateur=collaborateur, jour=PAST, demi_journee='AM',
            motif=motif_conge, created_by=admin_user, updated_by=admin_user,
        )
        res = collab_client.delete(f'/api/v1/planning/entry/{past_entry.id}/')
        assert res.status_code == 403

    def test_delete_creates_history_record(self, admin_client, entry_today):
        """La suppression d'une entrée crée un enregistrement dans l'historique."""
        entry_id   = entry_today.id
        collab_id  = entry_today.collaborateur.id
        admin_client.delete(f'/api/v1/planning/entry/{entry_id}/')

        hist = HistoriqueModification.objects.filter(
            collaborateur_id=collab_id, action='DELETE'
        ).first()
        assert hist is not None
        assert hist.planning_entry is None   # SET_NULL après suppression
        assert hist.ancien_motif is not None


# ── Lecture (GET /planning/) ──────────────────────────────────────────────────

@pytest.mark.django_db
class TestPlanningRead:

    def test_manager_can_filter_by_date_range(
        self, manager_client, collaborateur, motif_conge, admin_user
    ):
        PlanningEntry.objects.create(
            collaborateur=collaborateur, jour=FUTURE, demi_journee='AM',
            motif=motif_conge, created_by=admin_user, updated_by=admin_user,
        )
        res = manager_client.get('/api/v1/planning/', {
            'date_debut': str(FUTURE - timedelta(days=1)),
            'date_fin':   str(FUTURE + timedelta(days=1)),
        })
        assert res.status_code == 200
        results = res.data.get('results', res.data)
        assert len(results) >= 1

    def test_collab_sees_only_own_entries(
        self, collab_client, collaborateur, collaborateur2,
        motif_conge, admin_user
    ):
        """Un collaborateur ne voit que ses propres entrées."""
        PlanningEntry.objects.create(
            collaborateur=collaborateur, jour=FUTURE, demi_journee='AM',
            motif=motif_conge, created_by=admin_user, updated_by=admin_user,
        )
        PlanningEntry.objects.create(
            collaborateur=collaborateur2, jour=FUTURE, demi_journee='AM',
            motif=motif_conge, created_by=admin_user, updated_by=admin_user,
        )
        res = collab_client.get('/api/v1/planning/', {
            'date_debut': str(FUTURE - timedelta(days=1)),
            'date_fin':   str(FUTURE + timedelta(days=1)),
        })
        assert res.status_code == 200
        results = res.data.get('results', res.data)
        collab_ids = {e['collaborateur'] for e in results}
        assert collab_ids == {collaborateur.id}
