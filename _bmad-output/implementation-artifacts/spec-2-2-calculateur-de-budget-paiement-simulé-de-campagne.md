---
title: 'Story 2.2: Calculateur de Budget & Paiement Simulé de Campagne'
type: 'feature'
created: '2026-08-26'
status: 'done'
baseline_commit: 'fd61560c5a2c2ffab8e5fbab8c9fe29d67711ca5'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les campagnes créées doivent être verrouillées financièrement via le dépôt de leur budget total en compte séquestre immuable (`wallet_transactions`) avant de pouvoir être soumises aux administrateurs pour modération.

**Approach:** Implémenter l'interface `PaymentGatewayInterface` et le service `SimulatedPaymentDriver`, créer la migration `wallet_transactions` et le modèle `WalletTransaction`, puis ajouter l'endpoint `POST /api/v1/business/campaigns/{id}/pay` et la suite de tests `CampaignPaymentTest.php`.

## Boundaries & Constraints

**Always:**
- Valider le numéro Mobile Money (`+226...`) et le moyen de paiement (`orange_money`, `moov_money`).
- Exécuter la transaction dans une transaction de base de données (`DB::transaction()`).
- Générer une référence de transaction unique (ex: `TRX-OM-20260826-XXXX`).
- Enregistrer une transaction immuable dans `wallet_transactions` avec `status = 'escrow_locked'`.
- Mettre à jour `escrow_balance = total_budget_amount` et faire passer le statut de la campagne de `draft` à `pending_approval`.

**Ask First:**
- Intégration directe d'une passerelle Mobile Money réelle en production (ex: PayDunya, Bizao).

**Never:**
- Permettre le paiement d'une campagne déjà payée ou active.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Paiement Simulé Réussi | POST `/api/v1/business/campaigns/{id}/pay` avec `{ "payment_method": "orange_money", "phone_number": "+22670123456" }` | `{ "success": true, "message": "Paiement effectué et fonds séquestrés", "data": { "campaign_status": "pending_approval", "transaction_reference": "..." } }` | HTTP 200 OK |
| Paiement sur Campagne Déjà Payée | POST sur une campagne déjà au statut `pending_approval` ou `active` | `{ "success": false, "message": "Cette campagne a déjà été réglée." }` | HTTP 422 Unprocessable Entity |
| Numéro Invalide | POST avec numéro invalide (`+336...`) | `{ "success": false, "message": "Erreur de validation", "errors": [...] }` | HTTP 422 Unprocessable Entity |

</frozen-after-approval>

## Code Map

- `backend/app/Services/Payment/PaymentGatewayInterface.php` -- Interface du contrat de passerelle de paiement SapSap.
- `backend/app/Services/Payment/SimulatedPaymentDriver.php` -- Implémentation du driver de simulation Mobile Money.
- `backend/database/migrations/2026_08_26_203500_create_wallet_transactions_table.php` -- Migration du registre comptable à partie double (`wallet_transactions`).
- `backend/app/Models/WalletTransaction.php` -- Modèle Eloquent des transactions séquestres et paiements.
- `backend/app/Http/Controllers/Api/Business/CampaignPaymentController.php` -- Controller REST gérant l'action de paiement séquestre de campagne.
- `backend/routes/api.php` -- Route `POST /v1/business/campaigns/{id}/pay`.
- `backend/tests/Feature/CampaignPaymentTest.php` -- Suite de tests automatisés pour le calcul de budget et le paiement séquestre simulé.

## Tasks & Acceptance

**Execution:**
- [x] `backend/app/Services/Payment/PaymentGatewayInterface.php` & `SimulatedPaymentDriver.php` -- Créer l'interface et le service de paiement simulé.
- [x] `backend/database/migrations/2026_08_26_203500_create_wallet_transactions_table.php` -- Créer la migration de la table `wallet_transactions`.
- [x] `backend/app/Models/WalletTransaction.php` -- Créer le modèle `WalletTransaction` avec relations et casts.
- [x] `backend/app/Http/Controllers/Api/Business/CampaignPaymentController.php` -- Implémenter le paiement de campagne et la mise en séquestre.
- [x] `backend/routes/api.php` -- Enregistrer la route `POST /v1/business/campaigns/{id}/pay`.
- [x] `backend/tests/Feature/CampaignPaymentTest.php` -- Créer la suite de tests automatisés PHPUnit.

**Acceptance Criteria:**
- **Given** une campagne en statut `draft`, **When** le responsable d'entreprise soumet son numéro Orange/Moov Money sur POST `/api/v1/business/campaigns/{id}/pay`, **Then** la passerelle simulée valide le règlement, la transaction séquestre `escrow_locked` est créée et la campagne passe en `pending_approval`.

## Design Notes

- Implémentation conforme aux invariants **AD-6** (Payment Gateway Pattern) et **AD-7** (Double-entry ledger & escrow).

## Verification

**Commands:**
- `docker compose exec backend php artisan migrate --force` -- expected: Migration SUCCESS
- `docker compose exec backend php artisan test --filter=CampaignPaymentTest` -- expected: Tests PASS
- `curl -X POST http://localhost:8080/api/v1/business/campaigns/1/pay -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"payment_method": "orange_money", "phone_number": "+22670123456"}'` -- expected: HTTP 200 OK

## Suggested Review Order

**Passerelle de Paiement Mobile Money**

- Contrat d'interface PaymentGatewayInterface & Driver simulé Orange/Moov Money
  [`PaymentGatewayInterface.php:1`](../../backend/app/Services/Payment/PaymentGatewayInterface.php#L1)

- Driver de simulation
  [`SimulatedPaymentDriver.php:1`](../../backend/app/Services/Payment/SimulatedPaymentDriver.php#L1)

**Contrôleur de Paiement & Séquestre**

- Implémentation du paiement séquestre immuable et changement de statut
  [`CampaignPaymentController.php:1`](../../backend/app/Http/Controllers/Api/Business/CampaignPaymentController.php#L1)

**Modèle & Migration WalletTransaction**

- Registre comptable à partie double wallet_transactions
  [`2026_08_26_203500_create_wallet_transactions_table.php:1`](../../backend/database/migrations/2026_08_26_203500_create_wallet_transactions_table.php#L1)

- Model Eloquent WalletTransaction
  [`WalletTransaction.php:1`](../../backend/app/Models/WalletTransaction.php#L1)

**Suite de Tests Automatisés**

- Tests automatisés de paiement Mobile Money et verrouillage séquestre
  [`CampaignPaymentTest.php:1`](../../backend/tests/Feature/CampaignPaymentTest.php#L1)

