# 📋 Cahier des Charges — Gestion d'un Cabinet Médical

## 1. Explicitation des Besoins Clients

Le projet vise à moderniser et digitaliser la gestion d'un cabinet de médecine générale. Le client exprime le besoin d'une plateforme centralisée accessible par quatre types d'utilisateurs distincts.

### 1.1 Besoins Fonctionnels (Spécifications)
- **Administration (RH)** : Gestion exclusive du personnel (médecins et secrétaires) avec contrôle des accès.
- **Gestion Administrative (Secrétariat)** : Centralisation des dossiers patients et gestion du planning global du cabinet.
- **Suivi Médical (Médecin)** : Consultation des antécédents, rédaction de comptes-rendus et génération d'ordonnances en temps réel.
- **Service Patient (Libre-service)** : Autonomie complète pour la prise, le suivi et l'annulation de rendez-vous en ligne.
- **Système de Créneaux** : Algorithme anti-chevauchement garantissant qu'un créneau (30 min) ne peut être réservé deux fois pour le même médecin.

### 1.2 Besoins Non-Fonctionnels
- **Sécurité** : Hachage des mots de passe (Bcrypt) et authentification sécurisée par jeton (JWT).
- **Disponibilité** : Architecture Client/Serveur avec base de données MySQL persistante.
- **Ergonomie** : Interface responsive (adaptée aux tablettes et smartphones des médecins).
- **Traçabilité** : Journalisation (Logs) des actions critiques.

---

## 2. Choix du Modèle pour le Cycle de Vie

Le modèle choisi pour ce projet est le **Modèle Incrémental**.

### 2.1 Présentation du modèle choisi
Le modèle incrémental décompose le projet en plusieurs itérations (incréments). Chaque incrément ajoute une fonctionnalité complète au système, de l'analyse à la livraison.

### 2.2 Pourquoi ce modèle est adapté au projet ?
1. **Priorisation des risques** : Nous avons pu livrer le module d'authentification et de sécurité en premier (Incrément 1), garantissant la base du système.
2. **Visibilité** : Le client peut voir évoluer les modules métier (Patients, RDV, Consultations) les uns après les autres.
3. **Flexibilité** : Les ajustements sur la gestion des créneaux ont pu être faits après la mise en place du module patient, sans impacter le module admin.

### 2.3 Description des étapes selon le modèle incrémental
- **Analyse Globale** : Définition des 27 cas d'utilisation et du schéma MySQL.
- **Incrément 1 (Cœur)** : Authentification, rôles et sécurité.
- **Incrément 2 (Admin/Secrétaire)** : CRUD Personnel et Patients.
- **Incrément 3 (Planning)** : Algorithme de réservation et gestion des rendez-vous.
- **Incrément 4 (Médical)** : Consultations, ordonnances et historique.
- **Validation Finale** : Tests d'intégration et déploiement.

---

## 3. Planning Prévisionnel

| Phase | Durée | Livrables |
|-------|-------|-----------|
| **Conception & Analyse** | 1 semaine | Diagrammes UML (Cas d'utilisation, Classes, MPD) |
| **Incrément 1 : Base & Sécurité** | 1 semaine | API Auth, Middleware JWT, Table Users |
| **Incrément 2 : Gestion Administrative**| 2 semaines | Dashboard Admin & Secrétaire, CRUD Patients |
| **Incrément 3 : Moteur de RDV** | 1 semaine | Algorithme de slots, Dashboard Patient |
| **Incrément 4 : Suivi Médical** | 2 semaines | Dashboard Médecin, Prescription, Historique |
| **Tests & Recette** | 1 semaine | Rapport de tests, Documentation technique |

**Total estimé : 8 semaines.**
