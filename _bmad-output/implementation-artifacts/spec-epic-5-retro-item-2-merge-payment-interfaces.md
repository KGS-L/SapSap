---
title: 'Fusion de PaymentGatewayInterface et PaymentDriverInterface en interface unique'
type: 'refactor'
created: '2026-08-27'
status: 'done'
baseline_commit: '49962029c7c47a5e20f2f617b209537b97e7fd04'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Il existe une dualité de contrats de paiement avec `PaymentGatewayInterface` (Story 2.2) et `PaymentDriverInterface` (Story 5.1) qui définissent des méthodes de paiement et retrait similaires et obligent `SimulatedPaymentDriver` à implémenter deux interfaces concurrentes.

**Approach:** Fusionner ces deux interfaces en une interface canonique unique `PaymentGatewayInterface` contenant les contrats pour les dépôts/paiements et les versements/retraits Mobile Money, migrer `WalletService` et tous les consommateurs vers cette interface unique, et supprimer `PaymentDriverInterface`.

## Boundaries & Constraints

**Always:**
- Utiliser `App\Services\Payment\PaymentGatewayInterface` comme unique contrat d'interface pour l'ensemble des opérations de paiement et de retrait Mobile Money (Orange Money, Moov Money, Telecel).
- Conserver la compatibilité totale avec les signatures d'appels existantes (`processPayment`, `payout`, `processPayout`, `processDeposit`) au sein de `SimulatedPaymentDriver`.
- S'assurer que l'injection de dépendances dans Laravel (`AppServiceProvider`, `WalletService`, `WalletController`, `CampaignPaymentController`) injecte et résout `PaymentGatewayInterface`.
- Valider la syntaxe PHP (`php -l`) sur tous les fichiers modifiés.

**Ask First:**
- Modification des formats de retours des méthodes de simulation de paiement.

**Never:**
- Laisser `PaymentDriverInterface.php` comme contrat actif distinct dans le projet.
- Casser les fonctionnalités existantes de séquestre de budget de campagne ou de retrait de fonds contributeur.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Paiement Séquestre Campagne | `processPayment('+22670123456', 50000, 'orange_money')` | `{ success: true, reference: 'TRX-OM-...', amount: 50000, ... }` | Renvoie `success: false` si échec |
| Retrait Contributeur Mobile | `payout('+22670123456', 2500, 'orange_money')` | `{ success: true, reference: 'POUT-OM-...', amount: 2500, ... }` | Renvoie `success: false` si échec |
| Payout Détaillé WalletService | `processPayout(2500, 'orange_money', '+22670123456')` | `{ success: true, transaction_id: 'OM-BF-...', provider: 'orange_money', ... }` | Renvoie `success: false` si échec |
| Dépôt Séquestre Détaillé | `processDeposit(50000, 'orange_money', '+22670123456')` | `{ success: true, transaction_id: 'DEP-BF-...', status: 'completed', ... }` | Renvoie `success: false` si échec |

</frozen-after-approval>

## Code Map

- `backend/app/Services/Payment/PaymentGatewayInterface.php` -- Interface de contrat unique pour les transactions financières (dépôt, paiement, payout, retrait)
- `backend/app/Services/Payment/PaymentDriverInterface.php` -- Fichier d'interface obsolète à supprimer
- `backend/app/Services/Payment/SimulatedPaymentDriver.php` -- Driver de simulation implémentant l'unique interface `PaymentGatewayInterface`
- `backend/app/Services/WalletService.php` -- Service financier utilisant `PaymentGatewayInterface` au lieu de `PaymentDriverInterface`
- `backend/app/Providers/AppServiceProvider.php` -- Liaison du conteneur de services IoC pour `PaymentGatewayInterface`

## Tasks & Acceptance

**Execution:**
- [x] `backend/app/Services/Payment/PaymentGatewayInterface.php` -- Enrichir le contrat d'interface unifié avec les méthodes standardisées de paiement entrant (`processPayment`, `processDeposit`) et sortant (`payout`, `processPayout`) -- Consolider le contrat en une interface unique
- [x] `backend/app/Services/Payment/SimulatedPaymentDriver.php` -- Mettre à jour la déclaration de classe pour implémenter uniquement `PaymentGatewayInterface` -- Nettoyer l'implémentation de double interface
- [x] `backend/app/Services/WalletService.php` -- Remplacer `PaymentDriverInterface` par `PaymentGatewayInterface` dans les imports, le typehinting de propriété et le constructeur -- Aligner le service financier sur l'interface canonique
- [x] `backend/app/Providers/AppServiceProvider.php` -- Vérifier et assurer la liaison de `PaymentGatewayInterface::class` vers `SimulatedPaymentDriver::class` -- Garantie de résolution IoC
- [x] `backend/app/Services/Payment/PaymentDriverInterface.php` -- Supprimer le fichier d'interface devenu obsolète -- Élimination de la duplication de code

**Acceptance Criteria:**
- Given le dossier `backend/app/Services/Payment`, when on liste les fichiers d'interface, then seul `PaymentGatewayInterface.php` existe et `PaymentDriverInterface.php` n'est plus présent.
- Given la classe `SimulatedPaymentDriver`, when on vérifie sa clause `implements`, then elle implémente uniquement `PaymentGatewayInterface`.
- Given la classe `WalletService`, when on inspecte son constructeur et ses propriétés, then elle référence `PaymentGatewayInterface`.
- Given l'ensemble des fichiers PHP modifiés, when on exécute `php -l`, then aucune erreur de syntaxe n'est relevée.

## Spec Change Log

## Design Notes

L'interface unifiée `PaymentGatewayInterface` regroupe :
1. `processPayment(string $phoneNumber, int $amount, string $paymentMethod, array $metadata = []): array` : paiement/dépôt séquestre business.
2. `payout(string $phoneNumber, int $amount, string $paymentMethod, array $metadata = []): array` : retrait/versement Mobile Money contributeur.
3. `processPayout(int $amount, string $provider, string $phoneNumber, array $metadata = []): array` : versement Mobile Money avec détails opérateur.
4. `processDeposit(int $amount, string $provider, string $phoneNumber, array $metadata = []): array` : dépôt/séquestre avec détails opérateur.

## Verification

**Commands:**
- `php -l backend/app/Services/Payment/PaymentGatewayInterface.php` -- expected: No syntax errors detected
- `php -l backend/app/Services/Payment/SimulatedPaymentDriver.php` -- expected: No syntax errors detected
- `php -l backend/app/Services/WalletService.php` -- expected: No syntax errors detected
- `php -l backend/app/Providers/AppServiceProvider.php` -- expected: No syntax errors detected
- `Test-Path "backend/app/Services/Payment/PaymentDriverInterface.php"` -- expected: False

## Suggested Review Order

**Contrat Unique de Paiement & Payout**

- Contrat d'interface unifié intégrant les paiements entrants et les versements/retraits
  [`PaymentGatewayInterface.php:5`](../../backend/app/Services/Payment/PaymentGatewayInterface.php#L5)

- Implémentation du simulateur alignée sur l'interface unique canonique
  [`SimulatedPaymentDriver.php:8`](../../backend/app/Services/Payment/SimulatedPaymentDriver.php#L8)

- Remplacement du typage et injection de PaymentGatewayInterface dans le service financier
  [`WalletService.php:19`](../../backend/app/Services/WalletService.php#L19)

