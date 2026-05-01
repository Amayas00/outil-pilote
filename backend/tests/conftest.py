"""
Fixtures partagées entre tous les tests.
Chaque fixture crée les données minimales nécessaires
sans dépendre de fixtures Django (loaddata) pour rester isolé.
"""
import pytest
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from teams.models import Region, Domaine, Equipe, Collaborateur, AffectationCollaborateur
from planning.models import Motif, PlanningEntry

User = get_user_model()


# ── Users ─────────────────────────────────────────────────────────────────────

@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email='admin@test.com', password='admin1234', role='admin'
    )

@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        email='manager@test.com', password='manager1234', role='manager'
    )

@pytest.fixture
def collab_user(db):
    return User.objects.create_user(
        email='collab@test.com', password='collab1234', role='collaborateur'
    )


# ── API clients ───────────────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client

@pytest.fixture
def manager_client(manager_user):
    client = APIClient()
    client.force_authenticate(user=manager_user)
    return client

@pytest.fixture
def collab_client(collab_user, collaborateur):
    """Client authentifié lié à un vrai collaborateur."""
    collaborateur.user = collab_user
    collaborateur.save()
    client = APIClient()
    client.force_authenticate(user=collab_user)
    return client


# ── Base data ─────────────────────────────────────────────────────────────────

@pytest.fixture
def region(db):
    return Region.objects.create(nom='Île-de-France')

@pytest.fixture
def region2(db):
    return Region.objects.create(nom='PACA')

@pytest.fixture
def domaine(db):
    return Domaine.objects.create(nom='automobile')

@pytest.fixture
def equipe(db, region, domaine):
    return Equipe.objects.create(nom='Souscription Auto Paris', region=region, domaine=domaine)

@pytest.fixture
def equipe2(db, region2, domaine):
    return Equipe.objects.create(nom='Souscription Auto Marseille', region=region2, domaine=domaine)

@pytest.fixture
def collaborateur(db, equipe):
    c = Collaborateur.objects.create(
        matricule='EMP-001', nom='Dupont', prenom='Jean',
        equipe=equipe, date_entree=date(2023, 1, 1), actif=True,
    )
    AffectationCollaborateur.objects.create(
        collaborateur=c, equipe=equipe, date_debut=date(2023, 1, 1)
    )
    return c

@pytest.fixture
def collaborateur2(db, equipe):
    c = Collaborateur.objects.create(
        matricule='EMP-002', nom='Martin', prenom='Sophie',
        equipe=equipe, date_entree=date(2023, 3, 1), actif=True,
    )
    AffectationCollaborateur.objects.create(
        collaborateur=c, equipe=equipe, date_debut=date(2023, 3, 1)
    )
    return c


# ── Motifs ────────────────────────────────────────────────────────────────────

@pytest.fixture
def motif_conge(db):
    return Motif.objects.create(
        code='CONGE', libelle='Congés', couleur_hex='#4CAF50',
        visible_collaborateur=True, ordre=1
    )

@pytest.fixture
def motif_mission(db):
    return Motif.objects.create(
        code='MISSION', libelle='Mission', couleur_hex='#2196F3',
        visible_collaborateur=False, ordre=4
    )

@pytest.fixture
def motif_maladie(db):
    return Motif.objects.create(
        code='MALADIE', libelle='Maladie', couleur_hex='#F44336',
        visible_collaborateur=True, ordre=2
    )


# ── Planning entries ──────────────────────────────────────────────────────────

@pytest.fixture
def entry_today(db, collaborateur, motif_conge, admin_user):
    return PlanningEntry.objects.create(
        collaborateur=collaborateur,
        jour=date.today(),
        demi_journee='AM',
        motif=motif_conge,
        created_by=admin_user,
        updated_by=admin_user,
    )
