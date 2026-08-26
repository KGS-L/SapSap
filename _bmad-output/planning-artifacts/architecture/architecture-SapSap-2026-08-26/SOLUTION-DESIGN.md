# Document de Conception de Solution Technique — SapSap MVP

**Projet :** SapSap (Marketplace B2B2C de Micro-Missions Terrain)  
**Marché Pilote :** Ouagadougou, Burkina Faso  
**Date :** 26 Août 2026  
**Statut :** Approuvé (Final)  

---

## 1. Vue d'Ensemble & Vision Architecturales

### 1.1 Contexte & Problématique
SapSap connecte les entreprises ayant besoin d'informations terrain vérifiées (présence produit, prix, affiches, audits, clients mystères) avec des personnes situées à proximité à Ouagadougou, capables de réaliser ces micro-missions rapidement via leur smartphone contre rémunération en Mobile Money.

### 1.2 Principes Directeurs
- **Simplicité Opérationnelle** : Choix d'un monolithe modulaire API REST sous Laravel 11 pour minimiser la complexité de déploiement et de maintenance au MVP.
- **Unification Frontend** : Utilisation d'Angular 18 pour toutes les interfaces Web (Business et Admin) et Mobile (Ionic 8 + Capacitor 6) afin d'assurer une cohérence de code et une réutilisation maximale.
- **Rigueur Comptable & Simulation** : Architecture de portefeuille basée sur un registre immuable (`wallet_transactions`) avec un composant de paiement sous forme de Driver adaptable (`SimulatedPaymentDriver`), permettant de simuler l'intégralité des flux financiers sans attendre d'identifiants d'agrégateur réels.
- **Sécurité & Anti-Fraude Intégrées** : Empreintes numériques SHA-256 pour prévenir la réutilisation des photos, blocage strict de la galerie mobile et validation spatiale PostGIS (<100m).

---

## 2. Modèle de Données & Schéma de la Base de Données

Le backend utilise PostgreSQL 16 avec PostGIS. Voici les tables principales du domaine :

```mermaid
erDiagram
    USERS ||--o| PROFILES : has
    USERS ||--o| COMPANIES : owns
    USERS ||--o| WALLETS : owns
    COMPANIES ||--o{ CAMPAIGNS : creates
    CAMPAIGNS ||--o{ MISSIONS : contains
    MISSIONS ||--o{ MISSION_ASSIGNMENTS : receives
    MISSIONS ||--o{ QUESTIONS : defines
    MISSION_ASSIGNMENTS ||--o| MISSION_SUBMISSIONS : produces
    MISSION_SUBMISSIONS ||--o{ SUBMISSION_ANSWERS : contains
    MISSION_SUBMISSIONS ||--o{ SUBMISSION_MEDIA : includes
    WALLETS ||--o{ WALLET_TRANSACTIONS : logs

    USERS {
        uuid id PK
        string phone_number
        string email
        string password
        string role
        timestamp created_at
    }

    COMPANIES {
        uuid id PK
        uuid user_id FK
        string company_name
        string sector
        string rccm
    }

    CAMPAIGNS {
        uuid id PK
        uuid company_id FK
        string title
        integer total_missions
        integer budget_total
        integer escrow_balance
        string status
    }

    MISSIONS {
        uuid id PK
        uuid campaign_id FK
        string title
        geometry location
        integer radius_meters
        integer reward_amount
        timestamp deadline
        string status
    }

    MISSION_SUBMISSIONS {
        uuid id PK
        uuid mission_id FK
        uuid contributor_id FK
        geometry submission_location
        decimal distance_meters
        string status
        timestamp submitted_at
    }

    SUBMISSION_MEDIA {
        uuid id PK
        uuid submission_id FK
        string file_path
        string sha256_hash
        geometry captured_location
        timestamp captured_at
    }

    WALLETS {
        uuid id PK
        uuid user_id FK
        integer pending_balance
        integer available_balance
        integer total_earned
    }

    WALLET_TRANSACTIONS {
        uuid id PK
        uuid wallet_id FK
        string type
        integer amount
        integer balance_before
        integer balance_after
        string status
        timestamp created_at
    }
```

---

## 3. Flux des Processus Majeurs

### 3.1 Cycle de Vie d'une Mission & Auto-Validation 48h

```mermaid
sequenceDiagram
    autonumber
    actor C as Contributeur (Mobile)
    participant B as Backend Laravel API
    participant J as Scheduler Job (48h)
    participant W as Portefeuille Contributeur

    C->>B: 1. Accepte & Réserve la mission (45 min)
    B-->>C: Mission verrouillée
    C->>B: 2. Soumet preuves (GPS <100m, Photos In-App, Réponses)
    B->>B: 3. Vérification SHA-256 & Distance GPS
    B-->>C: Soumission enregistrée (Statut: Submitted)
    
    alt Validation Manuelle (Admin / Business)
        B->>W: Admin clique "Valider" -> Crédit Solde Disponible
    else Auto-Validation (Après 48h)
        J->>B: Exécution toutes les heures (Recherche soumissions >48h)
        J->>B: Passage statut à "Validated"
        J->>W: Transfert Escrow -> Solde Disponible
    end
```

### 3.2 Flux Financier & Driver de Simulation Mobile Money

```mermaid
sequenceDiagram
    autonumber
    actor E as Entreprise
    actor C as Contributeur
    participant API as API Laravel
    participant Drv as SimulatedPaymentDriver
    participant Ledger as Table wallet_transactions

    Note over E, API: Dépôt de Campagne
    E->>API: Crée Campagne (ex: 20 missions x 3 000 FCFA = 60 000 FCFA)
    API->>Drv: processPayment(amount: 60000, provider: "ORANGE_MONEY")
    Drv-->>API: PaymentSuccess (Simulated TX #SIM-8921)
    API->>Ledger: Log escrow_deposit (+60 000 FCFA)

    Note over C, API: Demande de Retrait (>= 1 000 FCFA)
    C->>API: Demande de retrait (2 000 FCFA vers Mobile Money)
    API->>Ledger: Verification solde disponible >= 1000 FCFA
    API->>Drv: processPayout(amount: 2000, recipient: "+22670000000")
    Drv-->>API: PayoutSuccess (Simulated Payout #PO-3312)
    API->>Ledger: Log withdrawal_debit (-2 000 FCFA)
```

---

## 4. Spécifications des Interfaces & Découpage des Projets

### 4.1 Monolithe Modulaire Backend (`/backend`)
- **Framework** : Laravel 11.x
- **Modules** :
  - `Auth` : Authentification Sanctum (OTP & Email/Password).
  - `Campaign` : Gestion des campagnes et tarification.
  - `Mission` : Publication, réservation et géolocalisation.
  - `Submission` : Contrôles de soumission et traitement des photos.
  - `Wallet` : Registre comptable, crédits/débits et driver de simulation.
  - `Fraud` : Détection des doublons par hash SHA-256.

### 4.2 Application Mobile Contributeur (`/mobile-contributor`)
- **Stack** : Ionic 8 + Capacitor 6 + Angular 18.
- **Pages** :
  - `Missions` : Liste et Carte des opportunités autour de l'utilisateur.
  - `MissionDetail` : Exécution avec vérification GPS et caméra native.
  - `Activity` : Suivi de l'état des soumissions (En vérification, Validé, Rejeté).
  - `Wallet` : Consultation des soldes et demande de retrait (>= 1 000 FCFA).

### 4.3 Portail Business (`/web-business`)
- **Stack** : Angular 18 + TailwindCSS.
- **Fonctionnalités** : Wizard de création de campagne, suivi de complétion, visualisation des preuves terrain sur carte et export CSV/Excel.

### 4.4 Dashboard Admin (`/web-admin`)
- **Stack** : Angular 18 + TailwindCSS.
- **Fonctionnalités** : Modération des campagnes, revue des soumissions de missions, gestion KYC et suivi des retraits.

---

## 5. Stratégie de Recette & Vérification

1. **Tests unitaires & d'intégration (Backend Laravel)** : `php artisan test` pour valider le calcul des règles de distance Haversine, le hashage SHA-256 et le registre comptable.
2. **Simulation d'auto-validation 48h** : Test du job `CheckPendingSubmissionsJob` avec fausses dates de soumission.
3. **Tests Mobile (Capacitor)** : Validation du blocage de l'accès à la galerie photo sur émulateur Android.
