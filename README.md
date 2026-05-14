# 🏥 Cabinet Médical — Gestion Intégrée

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4-000000.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1.svg)](https://www.mysql.com/)

Une application Full-Stack complète pour la gestion d'un cabinet de médecine générale, respectant les principes de conception logicielle avancés (UML).

## 1. Fonctionnalités Clés

- **Multi-Rôles** : Admin, Médecin, Secrétaire, et Patient.
- **Gestion du Personnel** : L'admin gère les comptes médecins et secrétaires.
- **Prise de RDV** : Système intelligent de créneaux sans chevauchement.
- **Dossier Médical** : Historique complet, ordonnances dynamiques et comptes-rendus.
- **Design Responsive** : Optimisé pour mobile et desktop.
- **Sécurité** : Authentification JWT et rôles applicatifs.

## 2. Stack Technique

- **Frontend** : React 19, TypeScript, Tailwind CSS 4, Lucide Icons.
- **Backend** : Node.js, Express, JWT.
- **Database** : MySQL 8.0.
- **Outils** : Vite, npm.

## 3. Installation Rapide

```bash
# 1. Cloner le projet
git clone https://github.com/IMAD-0/Gestion-de-cabinet-m-dical-fullstack.git

# 2. Installer les dépendances
npm install

# 3. Configurer MySQL
# Importer le fichier database/schema.sql

# 4. Configurer le .env
# Copier .env.example vers .env et remplir vos accès MySQL

# 5. Lancer le projet
# Frontend
npm run dev

# Backend (Express)
node --import tsx server/index.ts

# → http://localhost:5173 
```

