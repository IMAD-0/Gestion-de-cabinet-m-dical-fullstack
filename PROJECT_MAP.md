# 🗂️ PROJECT_MAP — Cabinet Médical

## [TECH_STACK]

| Composant | Technologie | Version | Statut |
|-----------|------------|---------|--------|
| Frontend Framework | React | 19.2.3 | ✅ Stable |
| Language | TypeScript | 5.9.3 | ✅ Stable |
| Build Tool | Vite | 7.3.2 | ✅ Stable |
| CSS Framework | Tailwind CSS | 4.1.17 | ✅ Stable |
| Icons | Lucide React | latest | ✅ Stable |
| Package Manager | npm | 10.x | ✅ Stable |
| Database (Demo) | LocalStorage | — | ✅ Fonctionnel |
| Database (Prod) | MySQL | 8.0 | 📋 Prêt (schema.sql) |
| Backend (Prod) | Node.js + Express | 18+ | 📋 Prêt (api.ts) |

---

## [SYSTEM_FLOW]

### Flux d'Authentification
```
Utilisateur → LoginPage → AuthContext.login() → DataStore.authenticate() → User | null
                                                                                     │
                                                             ┌───────────────────────┘
                                                             ▼
                                                    Role-Based Navigation
                                                    ┌── Admin → AdminDashboard
                                                    ├── Patient → PatientDashboard
                                                    ├── Secretary → SecretaryDashboard
                                                    └── Doctor → DoctorDashboard
```

### Flux de Données
```
Component → Store Functions → LocalStorage (demo) | API → MySQL (prod)
                              ↕
                          Logger (async)
```

---

## [ARCHITECTURE]

```
src/
├── App.tsx                          # Root component + routing
├── main.tsx                         # Entry point
├── vite-env.d.ts                    # Vite type declarations
│
├── shared/                          # Core layer (shared logic)
│   ├── types.ts                     # Domain types (User, Patient, Appointment, etc.)
│   ├── store.ts                     # Data persistence layer (LocalStorage CRUD)
│   ├── api.ts                       # Backend REST API client (MySQL ready)
│   ├── auth.tsx                     # AuthContext (React Context)
│   └── logger.ts                    # Async non-blocking logger
│
├── components/                      # Shared UI components
│   └── Layout.tsx                   # Main layout (Sidebar + Header + Content)
│
├── features/                        # Feature modules (Domain-Driven)
│   ├── auth/
│   │   └── LoginPage.tsx            # Login + Registration
│   ├── admin/
│   │   └── AdminDashboard.tsx       # Staff management (UC2-5)
│   ├── patient/
│   │   └── PatientDashboard.tsx     # Appointments + History (UC7-11)
│   ├── secretary/
│   │   └── SecretaryDashboard.tsx   # Patients + Planning (UC12-21)
│   └── doctor/
│       └── DoctorDashboard.tsx      # Planning + Treat + History (UC18-27)
│
database/
└── schema.sql                       # MySQL schema (7 tables + views + procedures)

Documentation:
├── SETUP_GUIDE.md                   # Installation & MySQL guide
├── CONCEPTION.md                    # UML diagrams (use cases, classes, sequences, components)
└── PROJECT_MAP.md                   # This file
```

---

## [USE_CASES_MAPPING]

| UC | Description | Fichier | Composant/Section | Statut |
|:---|:---|:---|:---|:---:|
| UC1 | S'authentifier | `auth/LoginPage.tsx` + `shared/auth.tsx` | LoginPage, AuthContext | ✅ |
| UC2 | Gérer comptes médecin/sec | `admin/AdminDashboard.tsx` | AdminDashboard (view: doctors/secretaries) | ✅ |
| UC3 | Créer un compte | `admin/AdminDashboard.tsx` | Modal "Nouveau" | ✅ |
| UC4 | Modifier un compte | `admin/AdminDashboard.tsx` | Modal "Modifier" | ✅ |
| UC5 | Changer mot de passe | `admin/AdminDashboard.tsx` | Modal mot de passe | ✅ |
| UC6 | Créer un compte patient | `auth/LoginPage.tsx` + `secretary/SecretaryDashboard.tsx` | Register form / Modal Patient | ✅ |
| UC7 | Gérer ses rendez-vous | `patient/PatientDashboard.tsx` | view: appointments | ✅ |
| UC8 | Consulter créneaux disponibles | `patient/PatientDashboard.tsx` + `secretary/SecretaryDashboard.tsx` | Grille créneaux | ✅ |
| UC9 | Demander un rendez-vous | `patient/PatientDashboard.tsx` | Modal Nouveau RDV | ✅ |
| UC10 | Annuler un rendez-vous | `patient/PatientDashboard.tsx` | Bouton Annuler | ✅ |
| UC11 | Consulter son historique | `patient/PatientDashboard.tsx` | view: history | ✅ |
| UC12 | Gérer les patients | `secretary/SecretaryDashboard.tsx` | view: patients | ✅ |
| UC13 | Ajouter un patient | `secretary/SecretaryDashboard.tsx` | Modal "Ajouter" | ✅ |
| UC14 | Modifier un patient | `secretary/SecretaryDashboard.tsx` | Modal "Modifier" | ✅ |
| UC15 | Supprimer un patient | `secretary/SecretaryDashboard.tsx` | Confirmation suppression | ✅ |
| UC16 | Rechercher un patient | `secretary/SecretaryDashboard.tsx` + `doctor/DoctorDashboard.tsx` | Barre de recherche | ✅ |
| UC17 | Gérer les RDV du cabinet | `secretary/SecretaryDashboard.tsx` | view: planning | ✅ |
| UC18 | Consulter le planning | `secretary/SecretaryDashboard.tsx` + `doctor/DoctorDashboard.tsx` | Planning global/perso | ✅ |
| UC19 | Ajouter un RDV | `secretary/SecretaryDashboard.tsx` | Modal Nouveau RDV | ✅ |
| UC20 | Modifier un RDV | `secretary/SecretaryDashboard.tsx` | Modal Modifier | ✅ |
| UC21 | Annuler un RDV | `secretary/SecretaryDashboard.tsx` | Bouton Annuler | ✅ |
| UC22 | Traiter un rendez-vous | `doctor/DoctorDashboard.tsx` | view: treat + formulaire | ✅ |
| UC23 | Confirmer la présence | `doctor/DoctorDashboard.tsx` | Toggle Présent/Absent | ✅ |
| UC24 | Rédiger le compte-rendu | `doctor/DoctorDashboard.tsx` | Section Compte-rendu | ✅ |
| UC25 | Rédiger une ordonnance | `doctor/DoctorDashboard.tsx` | Section Ordonnance | ✅ |
| UC26 | Consulter historique patient | `doctor/DoctorDashboard.tsx` | view: patient-history | ✅ |
| UC27 | Demander RDV complémentaire | `doctor/DoctorDashboard.tsx` | Section Suivi (extend) | ✅ |

---

## [ORPHANS & PENDING]

### ✅ Complété
- [x] 27/27 Use Cases implémentés
- [x] 4 rôles avec interfaces dédiées
- [x] Authentification avec sessions
- [x] CRUD complet pour toutes les entités
- [x] Logging asynchrone
- [x] Design responsive (mobile + desktop)
- [x] Données de démonstration (seed data)
- [x] Documentation technique complète
- [x] Schéma MySQL avec vues et procédures stockées

### 📋 En attente (migration production)
- [ ] Déployer le backend Express (utilise api.ts)
- [ ] Configurer MySQL avec schema.sql
- [ ] Implémenter le hashage bcrypt des mots de passe
- [ ] Ajouter la validation JWT côté backend
- [ ] Configurer CORS pour la production
- [ ] Ajouter des tests unitaires et d'intégration
- [ ] Configurer un reverse proxy (nginx)

### 🔮 Améliorations futures (hors scope)
- [ ] Notifications par email (rappels RDV)
- [ ] Export PDF des ordonnances
- [ ] Tableau de bord avec graphiques
- [ ] Gestion des congés médecins
- [ ] Téléconsultation (vidéo)
- [ ] Multi-cabinets
