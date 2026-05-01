"""
Tests du module jours fériés.
Vérifie le CRUD admin, la liaison multi-régions,
et l'accès en lecture pour tous les rôles.
"""
import pytest
from calendar_app.models import JourFerie


@pytest.mark.django_db
class TestJoursFeriesPermissions:

    def test_admin_can_create_jour_ferie(self, admin_client):
        res = admin_client.post('/api/v1/jours-feries/', {
            'jour': '2025-05-01',
            'libelle': 'Fête du Travail',
            'type': 'ferie',
            'regions_ids': [],
        }, format='json')
        assert res.status_code == 201
        assert JourFerie.objects.filter(libelle='Fête du Travail').exists()

    def test_collab_cannot_create_jour_ferie(self, collab_client):
        res = collab_client.post('/api/v1/jours-feries/', {
            'jour': '2025-05-01',
            'libelle': 'Tentative',
            'type': 'ferie',
            'regions_ids': [],
        }, format='json')
        assert res.status_code == 403

    def test_anyone_can_read_jours_feries(self, collab_client, db):
        JourFerie.objects.create(jour='2025-05-01', libelle='Fête du Travail', type='ferie')
        res = collab_client.get('/api/v1/jours-feries/')
        assert res.status_code == 200

    def test_admin_can_delete_jour_ferie(self, admin_client, db):
        jf = JourFerie.objects.create(jour='2025-06-09', libelle='Lundi de Pentecôte', type='ferie')
        res = admin_client.delete(f'/api/v1/jours-feries/{jf.id}/')
        assert res.status_code == 204
        assert not JourFerie.objects.filter(pk=jf.id).exists()

    def test_manager_cannot_delete_jour_ferie(self, manager_client, db):
        jf = JourFerie.objects.create(jour='2025-06-09', libelle='Test', type='ferie')
        res = manager_client.delete(f'/api/v1/jours-feries/{jf.id}/')
        assert res.status_code == 403


@pytest.mark.django_db
class TestJoursFeriesRegions:

    def test_create_with_specific_regions(self, admin_client, region, region2):
        res = admin_client.post('/api/v1/jours-feries/', {
            'jour': '2025-07-14',
            'libelle': 'Fête Nationale',
            'type': 'ferie',
            'regions_ids': [region.id, region2.id],
        }, format='json')
        assert res.status_code == 201
        jf = JourFerie.objects.get(libelle='Fête Nationale')
        assert jf.regions.count() == 2

    def test_create_with_no_regions_applies_to_all(self, admin_client):
        res = admin_client.post('/api/v1/jours-feries/', {
            'jour': '2025-11-11',
            'libelle': 'Armistice',
            'type': 'ferie',
            'regions_ids': [],
        }, format='json')
        assert res.status_code == 201
        jf = JourFerie.objects.get(libelle='Armistice')
        assert jf.regions.count() == 0   # 0 = toutes les régions
        assert res.data['toutes_regions'] is True

    def test_filter_by_region_includes_global_jours(self, admin_client, region, db):
        """Un jour sans région spécifique doit apparaître dans le filtre par région."""
        JourFerie.objects.create(jour='2025-12-25', libelle='Noël', type='ferie')
        res = admin_client.get('/api/v1/jours-feries/', {'region': region.id})
        assert res.status_code == 200
        results = res.data.get('results', res.data)
        libelles = [j['libelle'] for j in results]
        assert 'Noël' in libelles

    def test_filter_by_annee(self, admin_client, db):
        JourFerie.objects.create(jour='2024-05-01', libelle='Fête 2024', type='ferie')
        JourFerie.objects.create(jour='2025-05-01', libelle='Fête 2025', type='ferie')

        res = admin_client.get('/api/v1/jours-feries/', {'annee': 2025})
        results = res.data.get('results', res.data)
        libelles = [j['libelle'] for j in results]
        assert 'Fête 2025' in libelles
        assert 'Fête 2024' not in libelles

    def test_update_regions(self, admin_client, region, region2, db):
        jf = JourFerie.objects.create(jour='2025-08-15', libelle='Assomption', type='ferie')
        jf.regions.set([region])

        res = admin_client.patch(f'/api/v1/jours-feries/{jf.id}/', {
            'regions_ids': [region2.id],
        }, format='json')
        assert res.status_code == 200
        jf.refresh_from_db()
        assert list(jf.regions.values_list('id', flat=True)) == [region2.id]
