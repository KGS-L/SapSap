---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/specs/spec-sapsap/SPEC.md
  - _bmad-output/specs/spec-sapsap/mission-types.md
  - _bmad-output/specs/spec-sapsap/anti-fraud-rules.md
  - _bmad-output/planning-artifacts/architecture/architecture-SapSap-2026-08-26/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/architecture/architecture-SapSap-2026-08-26/SOLUTION-DESIGN.md
  - cachier-de-charge.md
---

# SapSap - Epic & User Story Breakdown

## Overview

This document provides the complete epic and story breakdown for SapSap, decomposing the requirements from the PRD/SPEC, Architecture Spine, and Solution Design into implementable user stories.

## Requirements Inventory

### Functional Requirements

- **FR1** : Contributor registration via Burkina Faso phone number and OTP SMS verification.
- **FR2** : Contributor profile management, reputation score tracking, and history display.
- **FR3** : Mission discovery around contributor GPS position (list and map views in Ouagadougou) with distance, reward, and deadline filters.
- **FR4** : Temporary mission reservation for a 45-minute window, locking out other contributors during execution.
- **FR5** : On-site mission execution requiring GPS proximity validation (<100m), in-app camera photo capture, and questionnaire form completion.
- **FR6** : Online submission resilience with in-memory retry mechanism for transient network losses.
- **FR7** : Contributor wallet balance tracking (pending, available, total earned) and Mobile Money withdrawal requests starting at 1,000 FCFA.
- **FR8** : Company campaign creation wizard (type, location, questions, budget) and payment processing on business.sapsap.bf.
- **FR9** : Real-time campaign tracking dashboard, interactive map results view, and CSV/Excel result export for business users.
- **FR10** : Admin dashboard (admin.sapsap.bf) for campaign moderation, manual submission verification within 48h, KYC review, and payout approval.
- **FR11** : Automated 48h auto-validation background job (Laravel Scheduler) approving pending submissions older than 48 hours and releasing escrow funds.
- **FR12** : MVP Anti-Fraud module enforcing SHA-256 photo hash deduplication, server-side timestamps, and Device ID tracking.

### NonFunctional Requirements

- **NFR1** (Security & Integrity) : Native Capacitor camera constraint strictly enforced (gallery disabled); SHA-256 photo fingerprinting to prevent cross-mission reuse.
- **NFR2** (Geolocation Precision) : PostGIS/Haversine server-side distance calculations enforcing maximum 100m radius tolerance.
- **NFR3** (Accounting Reliability) : Double-entry ledger architecture (`wallet_transactions`) with interface-driven Simulated Payment Driver for Orange/Moov Money.
- **NFR4** (Mobile Performance) : Client-side image compression (JPEG 80%, max 1920x1080) optimized for 3G/4G network conditions in Ouagadougou.
- **NFR5** (Data Privacy & RBAC) : Media storage URLs secured via Laravel Sanctum and Spatie RBAC roles (super-admin, validator, company-admin, company-viewer).

### Additional Requirements

- **Backend Starter Stack** : Laravel 11 API REST (PHP 8.3+) + PostgreSQL 16 with PostGIS.
- **Web App Stack** : Angular 18+ for Business (`business.sapsap.bf`) and Admin (`admin.sapsap.bf`) portals.
- **Mobile App Stack** : Ionic 8 + Capacitor 6 + Angular 18 targeting Android devices.
- **Simulated Payment Driver** : Interface-driven `SimulatedPaymentDriver` for Orange Money & Moov Money deposit and withdrawal testing.

### UX Design Requirements

- **UX-DR1** : Clean, low-literacy-friendly mobile navigation bar (Missions, Activity, Wallet, Profile) with high contrast for outdoor daylight readability.
- **UX-DR2** : Interactive mission map cards displaying distance, reward, and deadline with one-tap "Accepter la mission" CTA.
- **UX-DR3** : Guided campaign creation wizard for business users with dynamic cost calculator preview prior to payment.

### FR Coverage Map

- **FR1** : Epic 1 — Stories 1.1, 1.2
- **FR2** : Epic 1 — Story 1.3
- **FR3** : Epic 3 — Story 3.1
- **FR4** : Epic 3 — Story 3.2
- **FR5** : Epic 3 — Stories 3.3, 3.4
- **FR6** : Epic 3 — Story 3.4
- **FR7** : Epic 5 — Story 5.1
- **FR8** : Epic 2 — Stories 2.1, 2.2
- **FR9** : Epic 5 — Stories 5.2, 5.3
- **FR10** : Epic 4 — Stories 4.1, 4.2
- **FR11** : Epic 4 — Story 4.4
- **FR12** : Epic 4 — Story 4.3

---

## Epic List

- **Epic 1** : Infrastructure de Base & Authentification Multi-Rôles
- **Epic 2** : Création de Campagnes & Paiement Simulé (Portail Business)
- **Epic 3** : Découverte, Réservation & Exécution des Missions (App Mobile Contributeur)
- **Epic 4** : Modération Admin, Anti-Fraude & Job d'Auto-Validation à 48h
- **Epic 5** : Portefeuille Financier, Retraits Mobile Money & Exploitation des Résultats

---

## Epic 1 : Infrastructure de Base & Authentification Multi-Rôles

Permettre à chaque type d'utilisateur (Contributeurs mobiles, Entreprises web, Administrateurs) de créer un compte sécurisé (OTP téléphone ou Email/Password), de s'authentifier via Laravel Sanctum et d'accéder à son profil et ses autorisations RBAC.

### Story 1.1 : Inscription & Authentification OTP Contributeur Mobile

As a **contributeur mobile**,
I want **m'inscrire et me connecter avec mon numéro de téléphone et un code OTP**,
So that **je puisse accéder à la plateforme SapSap en toute sécurité depuis mon smartphone**.

**Acceptance Criteria:**

**Given** un contributeur non authentifié ouvrant l'application mobile Ionic/Capacitor,
**When** il saisit son numéro de téléphone burkinabè (ex: `+226 70 00 00 00`) et ses informations de profil de base,
**Then** le backend Laravel génère un code OTP SMS à 6 chiffres (code de test `123456` en environnement dev/simulation).
**And** lorsque le contributeur valide le code OTP correct, l'API retourne un token Laravel Sanctum valide et l'utilisateur est redirigé vers l'accueil.

---

### Story 1.2 : Authentification Web Business & Admin avec Spatie RBAC

As a **représentant d'entreprise ou administrateur SapSap**,
I want **me connecter sur les portails Web Angular avec mon adresse email et mot de passe**,
So that **j'accède aux fonctionnalités réservées à mon rôle (Business ou Admin)**.

**Acceptance Criteria:**

**Given** un utilisateur naviguant sur `business.sapsap.bf` ou `admin.sapsap.bf`,
**When** il soumet des identifiants valides (email et mot de passe),
**Then** le backend Laravel authentifie l'utilisateur via Sanctum et lui attribue son rôle Spatie (`company-admin`, `super-admin`, `validator`).
**And** si l'utilisateur tente d'accéder à une route API ou IHM non autorisée par son rôle, le système retourne une erreur HTTP 403 Forbidden.

---

### Story 1.3 : Gestion du Profil Contributeur & Score de Réputation

As a **contributeur**,
I want **consulter et modifier les informations de mon profil ainsi que mon score SapSap**,
So that **je puisse suivre mon statut, ma réputation et mes données personnelles**.

**Acceptance Criteria:**

**Given** un contributeur connecté sur l'application mobile,
**When** il accède à l'onglet "Profil",
**Then** l'application affiche son nom, prénom, téléphone, quartier, date d'inscription, nombre de missions accomplies et son score SapSap (ex: 92/100).
**And** toute mise à jour des coordonnées est validée côté serveur avant d'être sauvegardée en base PostgreSQL.

---

## Epic 2 : Création de Campagnes & Paiement Simulé (Portail Business)

Permettre aux entreprises d'accéder au portail web `business.sapsap.bf`, de configurer une campagne de missions (définition des objectifs, lieux, questionnaires, photos demandées, budget) et d'effectuer le paiement via le Simulated Payment Driver.

### Story 2.1 : Wizard de Création de Campagne sur Portail Business

As a **responsable d'entreprise**,
I want **créer une nouvelle campagne de missions via un assistant pas-à-pas (Wizard)**,
So that **je puisse définir précisément les informations terrain dont j'ai besoin**.

**Acceptance Criteria:**

**Given** une entreprise connectée sur `business.sapsap.bf`,
**When** elle clique sur "+ Nouvelle campagne",
**Then** un wizard Angular s'affiche permettant de configurer : le type de mission (Vérification, Audit, Client Mystère), la localisation à Ouagadougou, les questions du formulaire, le nombre de photos requises et le nombre total de missions.
**And** la campagne est enregistrée en statut `draft` en base PostgreSQL.

---

### Story 2.2 : Calculateur de Budget & Paiement Simulé de Campagne

As a **responsable d'entreprise**,
I want **prévisualiser le coût total de ma campagne et régler par paiement Mobile Money simulé**,
So that **ma campagne soit validée et que le budget soit réservé en compte séquestre**.

**Acceptance Criteria:**

**Given** une campagne configurée dans le wizard,
**When** l'entreprise accède à l'étape de règlement,
**Then** l'IHM affiche le calcul transparent : (Prix/mission * Nombre de missions = Sous-total + Commission SapSap).
**And** lors de la validation du paiement, le backend invoque le `SimulatedPaymentDriver` qui simule la transaction Orange/Moov Money et crédite le compte séquestre de la campagne (`escrow_balance`) dans `wallet_transactions`.

---

## Epic 3 : Découverte, Réservation & Exécution des Missions (App Mobile Contributeur)

Permettre aux contributeurs à Ouagadougou de rechercher des missions sur carte et liste, de réserver une mission (45 min), de s'y déplacer et de soumettre les preuves (GPS <100m, caméra in-app, questionnaire) avec réessai réseau en cas de perte de connexion.

### Story 3.1 : Découverte des Missions sur Liste et Carte (Ouagadougou)

As a **contributeur mobile**,
I want **voir les missions disponibles autour de ma position sur une liste et une carte interactive**,
So that **je puisse choisir des missions proches de mon trajet**.

**Acceptance Criteria:**

**Given** un contributeur géolocalisé à Ouagadougou ouvrant l'onglet "Missions",
**When** l'application charge les données,
**Then** les cartes de missions affichent le titre, la distance en km, la récompense en FCFA, le quartier et la durée estimée.
**And** la vue carte (Leaflet / OpenStreetMap) affiche des marqueurs cliquables pour chaque mission disponible.

---

### Story 3.2 : Réservation Temporaire de Mission (Verrou 45 min)

As a **contributeur**,
I want **réserver une mission avant de me déplacer**,
So that **personne d'autre ne puisse la prendre pendant que je m'y rends**.

**Acceptance Criteria:**

**Given** une mission disponible,
**When** le contributeur clique sur "Accepter la mission",
**Then** le statut de la mission passe à `reserved` pour cet utilisateur avec un compte à rebours de 45 minutes.
**And** si la mission n'est pas soumise avant l'échéance des 45 minutes, le backend déverrouille automatiquement la mission et la rend à nouveau disponible sur la marketplace.

---

### Story 3.3 : Contrôle de Proximité GPS & Prise de Vue Caméra Natif

As a **contributeur sur le terrain**,
I want **valider ma présence sur les lieux de la mission et prendre les photos directement dans l'application**,
So that **mes preuves soient authentiques et certifiées par la plateforme**.

**Acceptance Criteria:**

**Given** un contributeur effectuant une mission réservée,
**When** il démarre l'exécution sur le point de mission,
**Then** l'application vérifie sa position GPS via `@capacitor/geolocation` ; si la distance au point est > 100m (calcul PostGIS/Haversine), la prise de vue est bloquée.
**And** les photos sont obligatoirement capturées via la caméra native (`CameraSource.Camera`), l'accès à la galerie mobile étant strictly désactivé.

---

### Story 3.4 : Soumission avec Résilience Réseau & Compression d'Image

As a **contributeur**,
I want **soumettre mon questionnaire et mes photos même en cas d'instabilité du réseau mobile**,
So that **mes données saisies ne soient pas perdues lors des baisses de connexion**.

**Acceptance Criteria:**

**Given** un questionnaire rempli et des photos capturées,
**When** le contributeur clique sur "Envoyer",
**Then** l'application compresse les images côté client (JPEG 80%, max 1920x1080) avant l'envoi HTTP.
**And** si une coupure réseau survient pendant la soumission, un message explicatif s'affiche et l'état du formulaire reste conservé en mémoire avec un bouton "Réessayer la transmission".

---

## Epic 4 : Modération Admin, Anti-Fraude & Job d'Auto-Validation à 48h

Permettre à l'administration SapSap de valider les nouvelles campagnes, d'examiner les soumissions, d'interdire les réutilisations d'images via hash SHA-256, et d'exécuter automatiquement la validation à 48h pour libérer les paiements.

### Story 4.1 : Dashboard Admin & Modération des Campagnes

As a **membre de l'équipe Admin SapSap**,
I want **consulter et modérer les campagnes créées par les entreprises**,
So that **seules les campagnes conformes et sécurisées soient publiées sur la marketplace**.

**Acceptance Criteria:**

**Given** un administrateur connecté sur `admin.sapsap.bf`,
**When** une entreprise soumet une nouvelle campagne,
**Then** la campagne apparaît dans la file "En attente de modération".
**And** l'admin peut examiner la légalité des missions, approuver la campagne (passage en statut `active`) ou la rejeter avec un motif.

---

### Story 4.2 : Interface de Revue Manuelle des Soumissions

As a **validateur Admin ou Entreprise**,
I want **examiner les soumissions de missions reçues (photos, réponses, position GPS)**,
So that **je puisse valider ou rejeter la prestation du contributeur**.

**Acceptance Criteria:**

**Given** une mission soumise par un contributeur en statut `submitted`,
**When** le validateur ouvre le détail de la soumission dans le dashboard,
**Then** le système affiche les réponses au questionnaire, les photos, la carte de localisation avec l'écart GPS réel et la date/heure serveur.
**And** le clic sur "Valider" crédite le solde du portefeuille du contributeur, tandis que le clic sur "Rejeter" demande un motif obligatoire.

---

### Story 4.3 : Contrôle Anti-Fraude avec Empreinte SHA-256 & Device ID

As a **système anti-fraude SapSap**,
I want **calculer l'empreinte numérique SHA-256 de chaque photo et vérifier le Device ID**,
So that **les réutilisations frauduleuses de photos et le multi-compte soient bloqués**.

**Acceptance Criteria:**

**Given** une photo envoyée lors d'une soumission de mission,
**When** le backend Laravel enregistre le fichier dans `storage/app/public/submissions/`,
**Then** il calcule son hash SHA-256 ; si ce hash existe déjà dans la table `media`, la soumission est automatiquement rejetée pour fraude.
**And** si plus de 2 comptes actifs partagent le même Device ID, une alerte est levée dans le dashboard d'administration.

---

### Story 4.4 : Job Planifié d'Auto-Validation à 48h (Laravel Scheduler)

As a **système SapSap**,
I want **valider automatiquement les soumissions en attente depuis plus de 48 heures**,
So that **les contributeurs soient rémunérés même en cas d'inactivité du client/admin**.

**Acceptance Criteria:**

**Given** le planificateur Laravel Scheduler exécutant le job `CheckPendingSubmissionsJob` chaque heure,
**When** une soumission reste en statut `submitted` depuis plus de 48 heures sans décision manuelle,
**Then** le job passe automatiquement son statut à `validated`, enregistre un événement d'auto-validation et déclenche le transfert des fonds depuis le compte séquestre de la campagne vers le solde disponible du portefeuille contributeur.

---

## Epic 5 : Portefeuille Financier, Retraits Mobile Money & Exploitation des Résultats

Permettre aux contributeurs de consulter leur solde et demander des retraits (dès 1 000 FCFA en simulation Mobile Money), et offrir aux entreprises l'accès aux résultats détaillés sur carte interactive et exportations CSV/Excel.

### Story 5.1 : Portefeuille Contributeur & Demande de Retrait (>= 1 000 FCFA)

As a **contributeur mobile**,
I want **consulter le solde de mon portefeuille et demander un virement vers mon compte Mobile Money**,
So that **je puisse encaisser mes gains dès que j'atteins le seuil de 1 000 FCFA**.

**Acceptance Criteria:**

**Given** un contributeur avec un solde disponible >= 1 000 FCFA dans son portefeuille,
**When** il saisit son numéro Mobile Money (Orange Money / Moov Money) et demande un retrait,
**Then** le backend vérifie la règle d'immuabilité du registre (`wallet_transactions`), enregistre une ligne `withdrawal_request` et appelle le `SimulatedPaymentDriver`.
**And** en mode simulation, le virement est confirmé immédiatement et le solde disponible est décrémenté du montant demandé.

---

### Story 5.2 : Suivi de Campagne en Temps Réel & Carte des Résultats

As a **responsable d'entreprise**,
I want **suivre la progression de mes campagnes en temps réel et afficher les points vérifiés sur une carte**,
So that **j'analyse directement l'état de mon réseau de distribution à Ouagadougou**.

**Acceptance Criteria:**

**Given** une entreprise connectée sur `business.sapsap.bf`,
**When** elle accède à une campagne active,
**Then** la page affiche le pourcentage d'avancement (ex: 16/20 missions réalisées), le budget consommé et une carte présentant l'ensemble des points contrôlés avec la synthèse des réponses et des photos.

---

### Story 5.3 : Exportation des Données de Campagne (CSV / Excel)

As a **responsable d'entreprise**,
I want **télécharger l'ensemble des données récoltées au format CSV ou Excel**,
So that **je puisse intégrer les résultats de l'étude terrain dans mes outils internes**.

**Acceptance Criteria:**

**Given** une campagne avec des missions complétées,
**When** l'utilisateur entreprise clique sur "Exporter CSV" ou "Exporter Excel",
**Then** le serveur génère un fichier structuré contenant pour chaque mission : identifiant, lieu, date/heure, coordonnées GPS, réponses au questionnaire et liens vers les photographies.
