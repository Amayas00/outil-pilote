# Outil Pilote — Planning & Workforce Management

Application fullstack de gestion de planning RH permettant aux équipes de souscription de visualiser et piloter les affectations de leurs collaborateurs sur une grille de 40 semaines avec granularité demi-journée (AM/PM).

> **Compte admin par défaut :** `admin@test.com` / `admin1234`

---

## Stack technique

| Côté | Technologie |
|------|------------|
| Backend | Django 6, Django REST Framework, JWT (simplejwt) |
| Base de données | SQLite (dev) / PostgreSQL (prod) |
| Frontend | React 18, Vite, Tailwind CSS 3 |
| Data fetching | TanStack Query v5 |
| HTTP client | Axios avec auto-refresh JWT |
| Dates | date-fns v3 |
| Routing | React Router v7 |

---

## Structure du projet

```
outil_pilote/
├── backend/
│   ├── accounts/              # User custom, auth JWT, permissions
│   ├── teams/                 # Region, Domaine, Equipe, Collaborateur
│   │   └── services.py        # changer_equipe(), creer_collaborateur()
│   ├── planning/              # Motif, PlanningEntry, HistoriqueModification
│   ├── calendar_app/          # JourFerie, JourFerieRegion
│   ├── config/                # settings.py, urls.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/
        │   ├── ui/            # Button, Input, Modal, Table, Badge, ActionMenu…
        │   ├── layout/        # AppLayout, Sidebar, TopBar
        │   ├── planning/      # PlanningGrid, PlanningFilters, CellContextMenu
        │   ├── collaborateurs/
        │   └── equipes/
        ├── context/           # AuthContext (session JWT)
        ├── hooks/             # useCollaborateurs, useEquipes, useJoursFeries…
        ├── pages/             # LoginPage, DashboardPage, PlanningPage…
        ├── services/          # api.js — Axios + auto-refresh token
        ├── styles/            # globals.css — design system tokens
        └── utils/             # planning.js — buildWeekRange, indexEntries
```

---

## Installation

### Prérequis

- Python 3.11+
- Node.js 18+
- npm 9+

### Backend Django

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py loaddata teams/fixtures/initial_data.json planning/fixtures/motifs.json
python manage.py runserver
# → http://localhost:8000
```

Le compte admin est créé automatiquement par le script de setup :
- Email : `admin@test.com`
- Mot de passe : `admin1234`

Pour créer un superutilisateur manuellement :

```bash
python manage.py createsuperuser
```

### Frontend React

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# → http://localhost:5173
```

Les deux serveurs doivent tourner simultanément.

### Variables d'environnement

**Frontend** — fichier `frontend/.env` :

```env
VITE_API_URL=http://localhost:8000/api/v1
```

**Backend** — à externaliser en production :

```env
SECRET_KEY=votre-cle-secrete-longue-et-aleatoire
DEBUG=False
ALLOWED_HOSTS=votre-domaine.com
```

---

## API REST

Tous les endpoints sont préfixés par `/api/v1/`.

### Authentification

| Méthode | Endpoint | Description | Droits |
|---------|----------|-------------|--------|
| POST | `/auth/login/` | Login → `access` + `refresh` + `user` | Public |
| POST | `/auth/refresh/` | Rafraîchir le token d'accès | Public |
| GET | `/auth/me/` | Profil de l'utilisateur connecté | Auth |

**Payload de login :**

```json
{
  "email": "admin@test.com",
  "password": "admin1234"
}
```

**Réponse 200 :**

```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": {
    "id": 1,
    "email": "admin@test.com",
    "role": "admin",
    "nom_complet": "Admin"
  }
}
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
| GET | `/planning/` | Grille planning filtrée |
| POST | `/planning/entry/` | Upsert une entrée (créer ou modifier) |
| DELETE | `/planning/entry/{id}/` | Supprimer une entrée |
| POST | `/planning/bulk/` | Saisie en masse multi-jours |
| GET | `/planning/historique/` | Historique des modifications |
| GET | `/motifs/` | Référentiel des motifs |

**Paramètres de la grille planning :**

```
GET /api/v1/planning/?date_debut=2025-01-01&date_fin=2025-03-31&region=1&equipe=2
```

**Upsert d'une entrée :**

```json
{
  "collaborateur": 5,
  "jour": "2025-06-15",
  "demi_journee": "AM",
  "motif": 1
}
```

### Calendrier

| Méthode | Endpoint | Droits |
|---------|----------|--------|
| GET/POST | `/jours-feries/` | Auth / Admin |
| GET/PATCH/DELETE | `/jours-feries/{id}/` | Admin |

---

## Modèle de données

### Décisions d'architecture clés

- **User ≠ Collaborateur** — un admin peut exister sans `Collaborateur` associé. Un `Collaborateur` archivé peut ne plus avoir de `User` actif.
- **Rôle centralisé dans `User.role`** — pas de duplication dans `Collaborateur`.
- **Région déduite** — `collaborateur.equipe.region` (pas de `region_id` redondant sur `Collaborateur`).
- **Dénormalisation délibérée** — `Collaborateur.equipe_id` est un champ de lecture rapide. La vérité historique vit dans `AffectationCollaborateur`. Toute modification passe obligatoirement par `services.changer_equipe()`.
- **Soft delete partout** — flags `actif` / `active` sur toutes les entités métier. Aucune suppression physique.

### Contraintes d'intégrité

| Table | Contrainte |
|-------|-----------|
| `PlanningEntry` | `UNIQUE(collaborateur_id, jour, demi_journee)` |
| `AffectationCollaborateur` | `UNIQUE(collaborateur_id) WHERE date_fin IS NULL` |
| `AffectationCollaborateur` | `CHECK(date_fin > date_debut)` |
| `Collaborateur` | `CHECK(date_sortie > date_entree)` |
| `JourFerieRegion` | PK composite `(jour_ferie_id, region_id)` |

### Index de performance

| Table | Index | Requête couverte |
|-------|-------|-----------------|
| `PlanningEntry` | `(collaborateur_id, jour)` | Grille planning sur une période |
| `PlanningEntry` | `(jour, motif_id)` | Agrégats par motif |
| `AffectationCollaborateur` | `(collaborateur_id, date_debut)` | Historique chronologique |
| `HistoriqueModification` | `(collaborateur_id, date_modif)` | Audit trail |
| `Collaborateur` | `(equipe_id, actif)` | Filtrage équipe dans la grille |

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

> Les permissions sont enforced **côté backend** (DRF). Le frontend effectue des redirections préventives mais ne remplace pas la sécurité backend.

---

## Motifs de planning

| Code | Libellé | Accessible au collaborateur |
|------|---------|:---:|
| `CONGE` | Congés | ✅ |
| `MALADIE` | Maladie | ✅ |
| `TEMPS_PARTIEL` | Temps partiel / Alternance | ✅ |
| `FORMATION` | Formation | ✅ |
| `MISSION` | Mission | ❌ |
| `REUNION` | Réunion | ❌ |
| `GESTION` | Gestion | ❌ |
| `VISITE` | Visite | ❌ |
| `OFIS` | OFIS | ❌ |
| `PAS_AFFECTATION` | Pas d'affectation | ❌ |

---

## Frontend — Composants UI

Tous les composants sont dans `src/components/ui/` et suivent le design system "Refined Slate" défini dans `tailwind.config.js`.

| Composant | Usage |
|-----------|-------|
| `Button` | Variantes : `primary`, `secondary`, `ghost`, `danger` — tailles : `xs`, `sm`, `md`, `lg` |
| `Input` | Label, message d'erreur, hint, icône gauche |
| `Select` | Même API qu'Input |
| `Modal` | Portal React, fermeture Escape, scroll lock, backdrop |
| `Table` | `Table`, `Thead`, `Th`, `Tbody`, `Tr`, `Td`, `TableSkeleton`, `TableEmpty` |
| `ActionMenu` | Menu contextuel avec portal et positionnement auto viewport |
| `ConfirmDialog` | Dialog de confirmation avec variante danger |
| `Badge` | Variantes colorées avec dot optionnel |
| `Skeleton` | Placeholders de chargement animés |
| `Tooltip` | 4 directions, sans dépendance externe |
| `SearchInput` | Input de recherche avec icône intégrée |
| `Spinner` | Indicateur de chargement, 3 tailles |

---

## Grille Planning — Implémentation

La grille est le composant central de l'application (`src/components/planning/PlanningGrid.jsx`).

**Performances :**
- `indexEntries()` construit un dictionnaire `"collabId-date-dj" → entry` avant le rendu — lookup O(1) par cellule.
- Les colonnes collaborateur utilisent `sticky left-0` en CSS natif.
- Les deux rangées d'en-têtes sont sticky en cascade (`top-0` / `top-[33px]`).

**Interactions :**
- Clic sur une cellule → context menu avec liste des motifs filtrés selon le rôle.
- Clic sur un motif → mutation TanStack Query avec `invalidateQueries` automatique.
- Les motifs avec `visible_collaborateur = false` sont masqués pour les collaborateurs standard.

---

## Lancer les tests

```bash
# Backend (à implémenter)
cd backend
pip install pytest pytest-django
pytest

# Frontend (à implémenter)
cd frontend
npm run test
```

---

## Améliorations possibles

- **Tests backend** — pytest-django sur les règles métier (contrainte unique planning, permissions, dates)
- **Tests frontend** — Vitest + Testing Library sur les composants critiques
- **Page historique** — qui a modifié quoi et quand sur le planning
- **Gestion des comptes** — lier `User` à `Collaborateur` depuis l'UI admin
- **Export planning** — PDF ou Excel sur la période affichée
- **Saisie en masse** — sélection multi-cellules et application d'un motif en un clic
- **PostgreSQL** — activer les contraintes `EXCLUDE` pour les chevauchements d'affectation
- **Variables d'environnement** — externaliser `SECRET_KEY` dans un `.env` Django

---

## Auteur

Projet réalisé dans le cadre d'un test technique fullstack Django + React.
