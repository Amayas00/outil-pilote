# Outil Pilote — Planning RH

Application fullstack de pilotage des plannings collaborateurs pour les équipes de souscription AXA.
Développée dans le cadre d'un test technique Développeur Fullstack.

---

## Stack technique

| Couche | Technologie | Version |
|--------|------------|---------|
| Backend | Django + Django REST Framework | 6.x / 3.15+ |
| Auth | djangorestframework-simplejwt | 5.3+ |
| Base de données | SQLite (dev) · PostgreSQL (prod) | — |
| Frontend | React + Vite | 18 / 6+ |
| Styles | Tailwind CSS | 3 |
| Data fetching | TanStack Query | v5 |
| HTTP | Axios avec auto-refresh JWT | — |
| Dates | date-fns | v3 |
| Routing | React Router | v7 |
| Tests | pytest-django | 67 tests |

---

## Prérequis

- Python 3.11+
- Node.js 18+
- npm 9+

---

## Installation

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata teams/fixtures/initial_data.json
python manage.py loaddata planning/fixtures/motifs.json
python manage.py runserver
```

Le serveur démarre sur **http://localhost:8000**

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

L'application démarre sur **http://localhost:5173**

> Les deux serveurs doivent tourner en parallèle.

### 3. Créer le compte administrateur

```bash
cd backend
python manage.py shell
```

```python
from accounts.models import User

User.objects.create_superuser(
    email='votre.email@axa.fr',
    password='votre_mot_de_passe',
    role='admin'
)
```

Connectez-vous sur http://localhost:5173 avec ces identifiants.

### 4. Créer des données de test

Pour tester tous les niveaux de droits, ouvrez un shell Django :

```bash
cd backend
python manage.py shell
```

Une fois dans le shell, copiez-collez ce script :

```python
from accounts.models import User
from teams.models import Region, Domaine, Equipe
from teams.services import creer_collaborateur
from datetime import date

# Équipe
region = Region.objects.get(nom='Ile-de-France')
domaine = Domaine.objects.get(nom='automobile')
equipe = Equipe.objects.create(
    nom='Souscription Auto Paris',
    region=region,
    domaine=domaine
)

# Collaborateur 1
u1 = User.objects.create_user(email='jean.dupont@axa.fr', password='test1234', role='collaborateur')
creer_collaborateur(matricule='EMP-001', nom='Dupont', prenom='Jean',
                    equipe=equipe, date_entree=date(2024, 1, 15), user=u1)

# Collaborateur 2
u2 = User.objects.create_user(email='marie.martin@axa.fr', password='test1234', role='collaborateur')
creer_collaborateur(matricule='EMP-002', nom='Martin', prenom='Marie',
                    equipe=equipe, date_entree=date(2024, 3, 1), user=u2)

# Manager
u3 = User.objects.create_user(email='paul.bernard@axa.fr', password='test1234', role='manager')
creer_collaborateur(matricule='EMP-003', nom='Bernard', prenom='Paul',
                    equipe=equipe, date_entree=date(2023, 9, 1), user=u3)

print("OK — données de test créées")
```

Vous disposez ensuite de 4 comptes pour tester :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| votre.email@axa.fr | votre choix | Administrateur |
| jean.dupont@axa.fr | test1234 | Collaborateur |
| marie.martin@axa.fr | test1234 | Collaborateur |
| paul.bernard@axa.fr | test1234 | Manager |

---

## Lancer les tests

```bash
cd backend
python -m pytest tests/ -v
```

67 tests couvrant : authentification JWT, contrainte unique planning, permissions par rôle, restrictions de date, motifs restreints, changement d'équipe, traçabilité historique, jours fériés.

---

## Structure du projet

```
outil_pilote/
├── backend/
│   ├── accounts/          # User custom (email), JWT, permissions
│   ├── teams/             # Region, Domaine, Equipe, Collaborateur
│   │   └── services.py    # changer_equipe(), creer_collaborateur()
│   ├── planning/          # Motif, PlanningEntry, HistoriqueModification
│   ├── calendar_app/      # JourFerie, JourFerieRegion
│   ├── config/            # settings.py, urls.py
│   ├── tests/             # 67 tests automatisés
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── assets/        # axa-logo.png
        ├── components/
        │   ├── ui/        # Button, Input, Modal, Table, Badge...
        │   ├── layout/    # AppLayout, Sidebar, TopBar
        │   ├── planning/  # PlanningGrid, PlanningFilters
        │   ├── collaborateurs/
        │   ├── equipes/
        │   └── jours-feries/
        ├── context/       # AuthContext — session JWT
        ├── hooks/         # useCollaborateurs, useEquipes, useJoursFeries
        ├── pages/         # LoginPage, DashboardPage, PlanningPage...
        ├── services/      # api.js — Axios + auto-refresh
        ├── styles/        # globals.css — design system AXA
        └── utils/         # planning.js — buildWeekRange, indexEntries
```

---

## API REST

Préfixe : `/api/v1/`

### Auth

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/login/` | Login → access + refresh + user |
| POST | `/auth/refresh/` | Rafraîchir le token |
| GET | `/auth/me/` | Profil connecté |

```json
// POST /auth/login/
{ "email": "...", "password": "..." }

// Réponse
{ "access": "eyJ...", "refresh": "eyJ...", "user": { "role": "admin", ... } }
```

### Équipes & Collaborateurs

| Méthode | Endpoint | Droits |
|---------|----------|--------|
| GET/POST | `/regions/` | Auth / Admin |
| GET | `/domaines/` | Auth |
| GET/POST | `/equipes/` | Auth / Admin |
| GET/PATCH | `/equipes/{id}/` | Admin |
| GET/POST | `/collaborateurs/` | Manager+ |
| GET/PATCH | `/collaborateurs/{id}/` | Manager+ |
| POST | `/collaborateurs/{id}/changer-equipe/` | Admin |
| GET | `/collaborateurs/{id}/affectations/` | Manager+ |

### Planning

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/planning/` | Grille avec filtres |
| POST | `/planning/entry/` | Upsert — créer ou modifier |
| DELETE | `/planning/entry/{id}/` | Supprimer |
| POST | `/planning/bulk/` | Saisie en masse |
| GET | `/planning/historique/` | Audit trail |
| GET | `/motifs/` | 10 motifs paramétrables |

### Calendrier

| Méthode | Endpoint | Droits |
|---------|----------|--------|
| GET/POST | `/jours-feries/` | Auth / Admin |
| GET/PATCH/DELETE | `/jours-feries/{id}/` | Admin |

---

## Droits & Permissions

| Action | Collaborateur | Manager | Admin |
|--------|:---:|:---:|:---:|
| Voir son propre planning | ✅ | ✅ | ✅ |
| Saisir motifs autorisés (jours futurs) | ✅ | ✅ | ✅ |
| Voir le planning de toute l'équipe | ❌ | ✅ | ✅ |
| Saisir tous les motifs | ❌ | ✅ | ✅ |
| Modifier des jours passés | ❌ | ✅ | ✅ |
| Gérer les collaborateurs | ❌ | ✅ | ✅ |
| Gérer les équipes | ❌ | ❌ | ✅ |
| Gérer les jours fériés | ❌ | ❌ | ✅ |
| Changer l'équipe d'un collaborateur | ❌ | ❌ | ✅ |

Les permissions sont enforced **côté backend** (DRF). Le frontend effectue des redirections préventives.

---

## Motifs de planning

| Code | Libellé | Saisie collaborateur |
|------|---------|:---:|
| CONGE | Congés | ✅ |
| MALADIE | Maladie | ✅ |
| TEMPS_PARTIEL | Temps partiel / Alternance | ✅ |
| FORMATION | Formation | ✅ |
| MISSION | Mission | ❌ |
| REUNION | Réunion | ❌ |
| GESTION | Gestion | ❌ |
| VISITE | Visite | ❌ |
| OFIS | OFIS | ❌ |
| PAS_AFFECTATION | Pas d'affectation | ❌ |

---

## Modèle de données — points clés

**Séparation User / Collaborateur** — `User` gère l'authentification, `Collaborateur` représente la personne dans l'organigramme. Le lien est nullable dans les deux sens.

**Rôle dans User uniquement** — pas de duplication dans `Collaborateur`. La région se déduit via `collaborateur.equipe.region`.

**Dénormalisation documentée** — `Collaborateur.equipe_id` est un champ de lecture rapide. La vérité historique est dans `AffectationCollaborateur`. Toute modification passe par `services.changer_equipe()`.

**Contraintes BDD principales :**

| Table | Contrainte |
|-------|-----------|
| `PlanningEntry` | `UNIQUE(collaborateur_id, jour, demi_journee)` |
| `AffectationCollaborateur` | `UNIQUE(collaborateur_id) WHERE date_fin IS NULL` |
| `AffectationCollaborateur` | `CHECK(date_fin > date_debut)` |
| `Collaborateur` | `CHECK(date_sortie > date_entree)` |

**Audit trail résistant** — `HistoriqueModification.planning_entry` est `SET NULL` : l'historique survit à la suppression d'une entrée planning.

---

## Hypothèses fonctionnelles

- **Login par email** — choix standard moderne, le cahier des charges ne précise pas le format.
- **Soft delete universel** — aucune suppression physique, les entités désactivées restent dans l'historique.
- **Jours fériés non bloquants** — affichés visuellement dans la grille mais la saisie reste possible si nécessaire.
- **Upsert planning** — un second POST sur le même slot met à jour le motif plutôt que retourner une erreur 400.

---

## Pistes d'amélioration

- Saisie en masse par sélection multi-cellules
- Export planning PDF ou Excel
- Page historique dédiée avec filtres
- Gestion des comptes utilisateurs depuis l'UI
- Tests frontend avec Vitest + Testing Library
- Migration vers PostgreSQL pour les contraintes d'exclusion avancées
- Variables d'environnement Django avec `python-decouple`

---

## Variable d'environnement

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:8000/api/v1
```

