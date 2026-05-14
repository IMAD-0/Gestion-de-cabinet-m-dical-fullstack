# 🏥 Guide d'Installation et de Configuration

> Application de Gestion d'un Cabinet Médical — Full-Stack React + Express + MySQL

---

## Table des Matières

1. [Prérequis](#1-prérequis)
2. [Modules et Dépendances](#2-modules-et-dépendances)
3. [Installation](#3-installation)
4. [Configuration MySQL](#4-configuration-mysql)
5. [Fichier `.env`](#5-fichier-env)
6. [Structure du Projet](#6-structure-du-projet)
7. [Démarrage](#7-démarrage)
8. [Comptes de Démonstration](#8-comptes-de-démonstration)
9. [API Endpoints](#9-api-endpoints)
10. [Exécution des Tests](#10-exécution-des-tests)
11. [Résolution des Problèmes](#11-résolution-des-problèmes)

---

## 1. Prérequis

| Outil | Version minimale | Recommandée | Vérification |
|-------|-----------------|-------------|-------------|
| **Node.js** | 18.x | 20.x LTS | `node --version` |
| **npm** | 9.x | 10.x | `npm --version` |
| **MySQL Server** | 8.0 | 8.0.x | `mysql --version` |
| **Git** | 2.40+ | latest | `git --version` |

---

## 2. Modules et Dépendances

### 2.1 Dépendances de Production (`dependencies`)

| Module | Version | Rôle |
|--------|---------|------|
| `react` | 19.2 | Framework UI — composants, hooks, state |
| `react-dom` | 19.2 | Rendu React dans le navigateur |
| `react-router-dom` | 7.x | Navigation côté client |
| `tailwind-merge` | 3.4 | Fusion intelligente de classes Tailwind |
| `clsx` | 2.1 | Construction conditionnelle de classNames |
| `lucide-react` | 1.x | Bibliothèque d'icônes SVG |
| **`express`** | 5.x | Framework serveur HTTP (Backend) |
| **`mysql2`** | 3.x | Pilote MySQL avec support des Promises |
| **`cors`** | 2.x | Gestion du Cross-Origin Resource Sharing |
| **`dotenv`** | 17.x | Chargement des variables d'environnement depuis `.env` |
| **`bcryptjs`** | 3.x | Hachage des mots de passe (bcrypt pur JS) |
| **`jsonwebtoken`** | 9.x | Génération et vérification des tokens JWT |

### 2.2 Dépendances de Développement (`devDependencies`)

| Module | Version | Rôle |
|--------|---------|------|
| `vite` | 7.3 | Build tool ultra-rapide |
| `@vitejs/plugin-react` | 5.x | Plugin React pour Vite (JSX, Fast Refresh) |
| `tailwindcss` | 4.1 | Framework CSS utilitaire |
| `@tailwindcss/vite` | 4.1 | Intégration Tailwind dans Vite |
| `typescript` | 5.9 | Typage statique |
| `@types/react` | 19.x | Types TypeScript pour React |
| `@types/react-dom` | 19.x | Types TypeScript pour React DOM |
| `@types/node` | 22.x | Types Node.js |
| `@types/express` | 5.x | Types TypeScript pour Express |
| `@types/cors` | 2.x | Types TypeScript pour CORS |
| `@types/jsonwebtoken` | 9.x | Types TypeScript pour JWT |
| `@types/bcryptjs` | 2.x | Types TypeScript pour bcryptjs |
| `vite-plugin-singlefile` | 2.3 | Regroupe tout dans un seul fichier HTML |
| **`vitest`** | 4.x | Framework de tests unitaires et d'intégration |
| **`jsdom`** | 29.x | Environnement DOM simulé pour les tests |
| **`@testing-library/react`** | 16.x | Utilitaires de test pour composants React |
| **`@testing-library/jest-dom`** | 6.x | Matchers Jest pour le DOM |
| **`@testing-library/user-event`** | 14.x | Simulation d'événements utilisateur |

### 2.3 Installation de toutes les dépendances

```bash
npm install
```

Ceci installe automatiquement toutes les dépendances listées dans `package.json`.

---

## 3. Installation

```bash
# 1. Cloner le dépôt
git clone <url-du-repo>
cd cabinet-medical

# 2. Installer toutes les dépendances (frontend + backend + tests)
npm install

# 3. Configurer la base de données (voir section 4)

# 4. Configurer le fichier .env (voir section 5)

# 5. Lancer le serveur backend
node --import tsx server/index.ts

# 6. Dans un autre terminal — lancer le frontend en mode dev
npm run dev
```

---

## 4. Configuration MySQL

### 4.1 Créer la base de données

```bash
# Option A : Importer le fichier SQL complet (schéma + données démo)
mysql -u root -p < database/schema.sql
```

Ou manuellement :

```sql
-- Se connecter à MySQL
mysql -u root -p

-- Créer la base
CREATE DATABASE cabinet_medical CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- (Optionnel) Créer un utilisateur dédié
CREATE USER 'cabinet_user'@'localhost' IDENTIFIED BY 'CabinetPass2025!';
GRANT ALL PRIVILEGES ON cabinet_medical.* TO 'cabinet_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4.2 Tables créées par `database/schema.sql`

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `users` | Tous les utilisateurs (admin, patient, médecin, secrétaire) | id, email, password_hash, role, first_name, last_name, phone |
| `patient_details` | Informations médicales des patients | user_id (FK), date_of_birth, address, blood_type, allergies (JSON) |
| `doctor_details` | Informations professionnelles des médecins | user_id (FK), specialization |
| `appointments` | Rendez-vous | id, patient_id (FK), doctor_id (FK), date, start_time, end_time, status |
| `consultations` | Comptes-rendus de consultation | id, appointment_id (FK), is_present, report, diagnosis, notes |
| `prescriptions` | Ordonnances (médicaments) | id, consultation_id (FK), medication_name, dosage, duration, instructions |
| `audit_log` | Journal d'audit système | id, level, action, timestamp |

### 4.3 Remarque importante

> ⚠️ Le fichier `database/schema.sql` insère les comptes de démonstration avec des mots de passe **hachés en dur** (`$2b$10$demoHash...`). Cependant, le serveur Express (`server/index.ts`) **remplace automatiquement ces hachages** par de vrais hachages `bcrypt` au premier démarrage via la fonction `seedDatabase()`. Vous n'avez donc rien à faire manuellement.

---

## 5. Fichier `.env`

Créer un fichier `.env` à la racine du projet :

```env
# ───────── Base de données MySQL ─────────
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cabinet_medical
DB_USER=root
DB_PASSWORD=

# ───────── Serveur Express ─────────
PORT=3001
JWT_SECRET=cabinet-medical-jwt-secret-2025

# ───────── CORS ─────────
CORS_ORIGIN=http://localhost:5173
```

> **Note** : `DB_PASSWORD` doit correspondre au mot de passe de votre utilisateur MySQL. Laisser vide si root n'a pas de mot de passe (développement local).

---

## 6. Structure du Projet

```
cabinet-medical/
│
├── 📁 server/                          # ── BACKEND (Express + MySQL) ──
│   ├── index.ts                         # Point d'entrée Express
│   │                                    #   - 11 routes API (auth, users, appointments, consultations)
│   │                                    #   - JWT auth middleware
│   │                                    #   - toCamel() mapping (MySQL → Frontend)
│   │                                    #   - Auto-seed avec bcrypt
│   │                                    #   - Sert le frontend build en production
│   └── db.ts                            # Pool de connexions MySQL (mysql2/promise)
│
├── 📁 database/
│   └── schema.sql                       # Schéma MySQL complet (7 tables + vues + procédures)
│
├── 📁 dist/                             # Build production (généré par `npm run build`)
│   └── index.html                       # SPA single-file
│
├── 📁 src/                              # ── FRONTEND (React + TypeScript) ──
│   │
│   ├── App.tsx                          # Composant racine + routage par rôle
│   ├── main.tsx                         # Point d'entrée React
│   ├── index.css                        # Styles Tailwind
│   ├── vite-env.d.ts                    # Types Vite
│   │
│   ├── 📁 shared/                       # Couche partagée (Core)
│   │   ├── types.ts                     # Types TypeScript du domaine
│   │   │                                #   User, Patient, Doctor, Appointment, Consultation...
│   │   ├── api.ts                       # Client HTTP REST → Express Backend
│   │   │                                #   login(), createUser(), createPatient(),
│   │   │                                #   CRUD appointments, consultations
│   │   ├── auth.tsx                     # AuthContext — JWT + useState React
│   │   ├── store.ts                     # Store sync (cache mémoire pour les lectures)
│   │   ├── logger.ts                    # Logger asynchrone (INFO/WARN/ERROR → LocalStorage)
│   │   ├── api.test.ts                  # Tests d'intégration API (mocked fetch)
│   │   └── logger.test.ts               # Tests unitaires du logger
│   │
│   ├── 📁 components/
│   │   └── Layout.tsx                   # Layout principal (Sidebar + Header + Content)
│   │                                    #   Responsive mobile/desktop
│   │                                    #   Navigation par rôle
│   │
│   ├── 📁 features/                     # Modules fonctionnels (Domain-Driven)
│   │   │
│   │   ├── 📁 auth/
│   │   │   ├── LoginPage.tsx            # Connexion + Inscription Patient (UC1, UC6)
│   │   │   └── LoginPage.test.tsx       # Tests composant (onglets, validation, API calls)
│   │   │
│   │   ├── 📁 admin/
│   │   │   └── AdminDashboard.tsx       # Dashboard + Gestion Personnel (UC2-5)
│   │   │                                #   - Tableau de bord avec statistiques
│   │   │                                #   - CRUD médecins et secrétaires
│   │   │                                #   - Changement de mot de passe
│   │   │
│   │   ├── 📁 patient/
│   │   │   └── PatientDashboard.tsx     # RDV + Historique (UC7-11)
│   │   │                                #   - Dashboard avec RDV à venir
│   │   │                                #   - Prise de RDV avec créneaux anti-chevauchement
│   │   │                                #   - Historique médical complet
│   │   │
│   │   ├── 📁 secretary/
│   │   │   └── SecretaryDashboard.tsx   # Patients + Planning (UC12-21)
│   │   │                                #   - CRUD patients (table avec scroll horizontal)
│   │   │                                #   - Planning global des RDV
│   │   │                                #   - Modals de création/modification
│   │   │
│   │   └── 📁 doctor/
│   │       └── DoctorDashboard.tsx      # Planning + Traitement + Historique (UC18-27)
│   │                                    #   - Planning personnel
│   │                                    #   - Formulaire traitement (présence, diagnostic, ordonnance)
│   │                                    #   - RDV complémentaire optionnel (extend UC27)
│   │                                    #   - Recherche et historique patient (UC26)
│   │
│   └── 📁 test/
│       ├── setup.ts                     # Configuration Vitest + @testing-library/jest-dom
│       └── backend.test.ts              # Tests logique backend (toCamel, slots, ACL)
│
├── 📁 public/                           # Assets statiques
│
├── .env                                 # Variables d'environnement (MySQL, JWT, Port)
├── index.html                           # Point d'entrée HTML
├── vite.config.ts                       # Configuration Vite (React, Tailwind, path alias)
├── vitest.config.ts                     # Configuration Vitest (jsdom, setup, alias)
├── tsconfig.json                        # Configuration TypeScript (strict, path @/)
├── package.json                         # Dépendances et scripts
│
└── 📄 Documentation/
    ├── README.md                        # Page d'accueil GitHub
    ├── SETUP_GUIDE.md                   # Ce fichier
    ├── CONCEPTION.md                    # Conception UML complète + Modèle physique
    ├── PROJECT_MAP.md                   # Cartographie du projet
    └── Manuel d'installation et d'utilisation.md  # Guide utilisateur final
```

---

## 7. Démarrage

### Mode Développement (2 terminaux)

```bash
# Terminal 1 — Backend Express (API + MySQL)
node --import tsx server/index.ts
# → ✅ Connected to MySQL
# → ✅ Database seeded with demo data
# → 🚀 Server: http://localhost:3001
# →    API:    http://localhost:3001/api

# Terminal 2 — Frontend React (Hot Reload)
npm run dev
# → http://localhost:5173 (appelle l'API sur :3001)
```

### Mode Production (1 terminal)

```bash
# Builder le frontend
npm run build

# Lancer le serveur (sert dist/ + /api)
node --import tsx server/index.ts
# → http://localhost:3001 (frontend + API)
```

---

## 8. Comptes de Démonstration

### Qu'est-ce que c'est ?

Les **Comptes de Démonstration** sont des comptes pré-créés automatiquement lors du premier démarrage du serveur. Ils permettent de tester immédiatement toutes les fonctionnalités de l'application sans avoir à créer de comptes manuellement. Les mots de passe sont **hachés avec bcrypt** (10 rounds de sel) et stockés dans la table `users` de MySQL.

Le serveur Express vérifie au démarrage si la table `users` est vide. Si oui, il insère automatiquement 7 comptes (1 admin, 2 médecins, 1 secrétaire, 3 patients) avec leurs informations détaillées.

### Liste des Comptes

| Rôle | Nom | Email | Mot de passe | Accès |
|------|-----|-------|-------------|-------|
| **Administrateur** | Admin Système | `admin@cabinet.fr` | `admin123` | Gestion du personnel (médecins, secrétaires) |
| **Médecin** | Dr. Jean Dupont | `dupont@cabinet.fr` | `doctor123` | Planning, consultations, ordonnances, dossiers patients |
| **Médecin** | Dr. Claire Martin | `martin@cabinet.fr` | `doctor123` | Planning, consultations, ordonnances, dossiers patients |
| **Secrétaire** | Marie Laurent | `marie@cabinet.fr` | `secret123` | Gestion patients, planning des RDV |
| **Patient** | Ahmed Benali | `ahmed@email.com` | `patient123` | Prise de RDV, historique médical |
| **Patient** | Sophie Dubois | `sophie@email.com` | `patient123` | Prise de RDV, historique médical |
| **Patient** | Karim Hassan | `karim@email.com` | `patient123` | Prise de RDV, historique médical |

### Données de démonstration incluses

En plus des comptes, le serveur crée :

| Donnée | Détails |
|--------|---------|
| **Rendez-vous** | 5 RDV (aujourd'hui + demain) avec statuts variés (pending, confirmed, cancelled) |
| **Consultations** | 2 consultations terminées avec ordonnances complètes |
| **Ordonnances** | 3 médicaments (Paracétamol, Myorelaxant, Amlodipine) |
| **Dossiers patients** | Date de naissance, adresse, groupe sanguin, allergies |

---

## 9. API Endpoints

| Méthode | Endpoint | Auth | Description | UC |
|---------|----------|:----:|-------------|:--:|
| `POST` | `/api/auth/login` | ❌ | Connexion → JWT token | UC1 |
| `GET` | `/api/users?role=` | ✅ | Liste des utilisateurs par rôle | — |
| `GET` | `/api/users/:id` | ✅ | Détail d'un utilisateur | — |
| `POST` | `/api/users` | ❌* | Créer un utilisateur (tous rôles) | UC3, UC6 |
| `PUT` | `/api/users/:id` | ✅ | Modifier un utilisateur | UC4, UC14 |
| `DELETE` | `/api/users/:id` | ✅ | Supprimer un utilisateur | UC15 |
| `PATCH` | `/api/users/:id/password` | ✅ | Changer le mot de passe | UC5 |
| `GET` | `/api/appointments` | ✅ | Liste RDV (filtres: doctorId, patientId, date) | UC18 |
| `POST` | `/api/appointments` | ✅ | Créer un RDV | UC9, UC19 |
| `PUT` | `/api/appointments/:id` | ✅ | Modifier un RDV | UC20 |
| `DELETE` | `/api/appointments/:id` | ✅ | Supprimer un RDV | UC21 |
| `GET` | `/api/consultations` | ✅ | Liste consultations (filtres: patientId, doctorId) | UC11, UC26 |
| `POST` | `/api/consultations` | ✅ | Créer consultation + ordonnance | UC22-25 |

\* La création de compte patient est publique (inscription). La création médecin/secrétaire nécessite d'être authentifié admin côté frontend.

---

## 10. Exécution des Tests

```bash
# Exécuter tous les tests
npx vitest run

# Mode watch (re-exécution automatique)
npx vitest

# Sortie détaillée
npx vitest run --reporter=verbose

# Exécuter un fichier spécifique
npx vitest run src/shared/api.test.ts
```

### Couverture des Tests

| Fichier de test | Type | Nombre de tests | Ce qui est testé |
|----------------|------|:---------------:|-----------------|
| `src/shared/logger.test.ts` | Unitaire | 5 | Niveaux INFO/WARN/ERROR, timestamps, cap 200 entrées |
| `src/shared/api.test.ts` | Intégration | 15+ | Login, register, CRUD users/appointments/consultations, headers JWT, erreurs |
| `src/features/auth/LoginPage.test.tsx` | Composant | 7 | Rendu, onglets, validation, appels API, credentials démo |
| `src/test/backend.test.ts` | Backend | 20+ | toCamel(), safeUser(), calcul créneaux, transitions statuts, ACL rôles |

---

## 11. Résolution des Problèmes

| Problème | Cause | Solution |
|----------|-------|----------|
| `❌ MySQL connection failed` | MySQL non démarré | `sudo systemctl start mysql` |
| `ER_ACCESS_DENIED_ERROR` | Identifiants incorrects | Vérifier `DB_USER` et `DB_PASSWORD` dans `.env` |
| `ER_BAD_DB_ERROR` | Base inexistante | Exécuter `mysql -u root -p < database/schema.sql` |
| Page blanche « Connexion au serveur... » | Backend non démarré | `node --import tsx server/index.ts` |
| CORS error en dev | Port frontend ≠ 5173 | Vérifier `CORS_ORIGIN` dans `.env` |
| `EADDRINUSE :3001` | Port occupé | `lsof -ti:3001 \| xargs kill -9` |
| Registration ne fonctionne pas | API non joignable | Vérifier que le backend tourne sur :3001 |
| Mot de passe refusé après seed | Hash bcrypt incohérent | Supprimer toutes les tables et re-importer `schema.sql`, puis relancer le serveur |
