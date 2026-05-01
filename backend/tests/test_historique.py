"""
Tests de la traçabilité des modifications planning.
Vérifie que chaque action (create, update, delete) génère
un enregistrement correct dans HistoriqueModification,
et que l'historique survit à la suppression des entrées.
"""
import pytest
from datetime import date, timedelta
from planning.models import PlanningEntry, HistoriqueModification

FUTURE = date.today() + timedelta(days=5)


@pytest.mark.django_db
class TestHistoriqueCreate:

    def test_create_entry_generates_history(self, admin_client, collaborateur, motif_conge):
        res = admin_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur.id,
            'jour': str(FUTURE),
            'demi_journee': 'AM',
            'motif': motif_conge.id,
        }, format='json')
        assert res.status_code == 201

        hist = HistoriqueModification.objects.filter(
            collaborateur=collaborateur,
            jour=FUTURE,
            demi_journee='AM',
            action='CREATE',
        ).first()
        assert hist is not None
        assert hist.nouveau_motif == motif_conge
        assert hist.ancien_motif is None

    def test_update_entry_generates_history_with_old_motif(
        self, admin_client, collaborateur, motif_conge, motif_maladie, admin_user
    ):
        """Une mise à jour enregistre l'ancien et le nouveau motif."""
        PlanningEntry.objects.create(
            collaborateur=collaborateur, jour=FUTURE, demi_journee='AM',
            motif=motif_conge, created_by=admin_user, updated_by=admin_user,
        )
        admin_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur.id,
            'jour': str(FUTURE),
            'demi_journee': 'AM',
            'motif': motif_maladie.id,
        }, format='json')

        hist = HistoriqueModification.objects.filter(
            collaborateur=collaborateur, action='UPDATE'
        ).first()
        assert hist is not None
        assert hist.ancien_motif == motif_conge
        assert hist.nouveau_motif == motif_maladie


@pytest.mark.django_db
class TestHistoriqueDelete:

    def test_delete_entry_generates_history(self, admin_client, entry_today):
        admin_client.delete(f'/api/v1/planning/entry/{entry_today.id}/')

        hist = HistoriqueModification.objects.filter(
            collaborateur=entry_today.collaborateur, action='DELETE'
        ).first()
        assert hist is not None
        assert hist.ancien_motif == entry_today.motif
        assert hist.nouveau_motif is None

    def test_history_survives_entry_deletion(self, admin_client, entry_today):
        """
        Règle métier critique : quand une entrée est supprimée,
        son historique doit rester avec planning_entry = NULL (SET_NULL).
        """
        entry_id = entry_today.id
        admin_client.delete(f'/api/v1/planning/entry/{entry_id}/')

        assert not PlanningEntry.objects.filter(pk=entry_id).exists()

        hist = HistoriqueModification.objects.filter(
            collaborateur=entry_today.collaborateur, action='DELETE'
        ).first()
        assert hist is not None
        assert hist.planning_entry is None  # SET_NULL confirme


@pytest.mark.django_db
class TestHistoriqueAPI:

    def test_manager_can_read_historique(self, manager_client, entry_today, admin_client):
        admin_client.delete(f'/api/v1/planning/entry/{entry_today.id}/')
        res = manager_client.get('/api/v1/planning/historique/')
        assert res.status_code == 200

    def test_collab_cannot_read_historique(self, collab_client):
        res = collab_client.get('/api/v1/planning/historique/')
        assert res.status_code == 403

    def test_historique_filterable_by_collaborateur(
        self, admin_client, manager_client, collaborateur, collaborateur2,
        motif_conge
    ):
        """Le filtre ?collaborateur= retourne uniquement les entrées de ce collab."""
        # Use the API so history is properly generated
        admin_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur.id,
            'jour': str(FUTURE),
            'demi_journee': 'AM',
            'motif': motif_conge.id,
        }, format='json')
        admin_client.post('/api/v1/planning/entry/', {
            'collaborateur': collaborateur2.id,
            'jour': str(FUTURE),
            'demi_journee': 'AM',
            'motif': motif_conge.id,
        }, format='json')

        res = manager_client.get('/api/v1/planning/historique/', {
            'collaborateur': collaborateur.id
        })
        assert res.status_code == 200
        results = res.data.get('results', res.data)
        assert len(results) >= 1
        collab_ids = {h['collaborateur'] for h in results}
        assert collab_ids == {collaborateur.id}
