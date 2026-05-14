# 📘 Manuel d’Installation et d’Utilisation

Ce document sert de guide officiel pour le déploiement et l'usage de l'application **Cabinet Médical**.

---

## 1. Guide d'Installation

### 1.1 Prérequis Système
- **Node.js** : v18.0.0 ou supérieure.
- **MySQL Server** : v8.0.0 ou supérieure.
- **Navigateur Web** : Chrome, Firefox ou Edge (versions récentes).

### 1.2 Configuration de la Base de Données
1. Lancez votre client MySQL (ex: MySQL Workbench ou CMD).
2. Créez une base de données : `CREATE DATABASE cabinet_medical;`.
3. Importez le script `database/schema.sql` fourni dans le dossier du projet.
4. Vérifiez que les tables (users, appointments, etc.) sont bien créées.

### 1.3 Configuration de l'Application
1. Installez les paquets : `npm install`.
2. Créez un fichier `.env` à la racine avec les paramètres suivants :
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=cabinet_medical
   JWT_SECRET=votre_cle_secrete
   PORT=3001
   ```

### 1.4 Lancement
- **Mode Développement** : `npm run dev` (Front) et `npx ts-node server/index.ts` (Back).
- **Mode Production** : `npm run build` puis servez le dossier `dist`.

---

## 2. Guide d'Utilisation par Rôle

### 👤 Administrateur
- **Objectif** : Gérer les ressources humaines du cabinet.
- **Actions** :
    - Créer des comptes pour les nouveaux médecins et secrétaires.
    - Modifier les informations du personnel ou réinitialiser leurs mots de passe.
    - Consulter les logs système pour surveiller l'activité.

### 👤 Secrétaire
- **Objectif** : Gestion administrative et flux des patients.
- **Actions** :
    - Enregistrer les nouveaux patients qui se présentent au cabinet.
    - Gérer le planning global : ajouter, modifier ou annuler des rendez-vous.
    - Confirmer les rendez-vous en attente.

### 👤 Médecin
- **Objectif** : Assurer le suivi médical et les consultations.
- **Actions** :
    - Consulter son planning personnel du jour.
    - **Traiter un rendez-vous** : Confirmer la présence, saisir le diagnostic, rédiger le compte-rendu et l'ordonnance.
    - Rechercher un patient pour consulter l'intégralité de son historique médical.

### 👤 Patient
- **Objectif** : Accéder aux services de soins de manière autonome.
- **Actions** :
    - Créer son compte en ligne.
    - Consulter les créneaux disponibles par médecin.
    - Demander ou annuler ses propres rendez-vous.
    - Consulter son historique personnel (ordonnances et rapports).

---

## 3. Maintenance et Sécurité
- Les mots de passe sont hashés en base de données.
- Les accès sont protégés par des tokens JWT.
- Une sauvegarde régulière de la base de données MySQL est recommandée :
  `mysqldump -u root -p cabinet_medical > backup.sql`
