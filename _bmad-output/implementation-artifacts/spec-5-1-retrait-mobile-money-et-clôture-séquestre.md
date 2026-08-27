---
title: 'Story 5.1 & 5.2: Retrait Mobile Money des Gains Contributeur & Clôture Séquestre'
type: 'feature'
created: '2026-08-26'
status: 'done'
baseline_commit: '8a6b45831518fdfdbcf6aee1fe4d7fd48348e3fd'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les contributeurs doivent pouvoir consulter leur solde cumulé de rémunération en FCFA et le retirer via Orange Money / Moov Money (+226) avec déduction comptable exacte du registre séquestre.

**Approach:** Étendre `PaymentGatewayInterface` et `SimulatedPaymentDriver` avec la méthode `payout()`, implémenter le contrôleur `WalletController` (`getBalance`, `withdraw`), enregistrer les routes `/v1/wallet/balance` et `/v1/wallet/withdraw`, et créer la suite de tests `WalletWithdrawalTest.php`.

## Boundaries & Constraints

**Always:**
- Exiger une authentification Sanctum avec rôle `contributor`.
- Vérifier le numéro de téléphone Burkina Faso (`+226` ou 8 chiffres commençant par 0, 5, 6, 7).
- Valider un montant minimum de retrait (500 FCFA).
- Calculer rigoureusement le solde disponible = ($\sum \text{contributor\_payout}$) - ($\sum \text{withdrawal}$).
- Rejeter HTTP 422 si le montant demandé excède le solde disponible.
- Consigner l'opération sous forme de transaction immuable de type `withdrawal` dans `wallet_transactions`.

**Ask First:**
- Modifier le montant minimum de retrait (500 FCFA).

**Never:**
- Autoriser un retrait supérieur au solde disponible.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Consultation Solde & Historique | GET `/api/v1/wallet/balance` | `{ "success": true, "data": { "available_balance": 5000, "transactions": [...] } }` | HTTP 200 OK |
| Retrait Réussi | POST `/api/v1/wallet/withdraw` avec `{ "amount": 2500, "payment_method": "orange_money", "phone_number": "+22670123456" }` | `{ "success": true, "message": "Retrait effectué avec succès", "data": { "new_balance": 2500, "reference": "..." } }` | HTTP 200 OK |
| Solde Insuffisant | POST `/api/v1/wallet/withdraw` de 10000 FCFA avec solde 2500 FCFA | `{ "success": false, "message": "Solde insuffisant." }` | HTTP 422 Unprocessable Entity |
| Retrait sous le Seuil Min | POST `/api/v1/wallet/withdraw` de 200 FCFA (< 500 FCFA) | `{ "success": false, "message": "Le montant minimum de retrait est de 500 FCFA." }` | HTTP 422 Unprocessable Entity |

</frozen-after-approval>

## Code Map

- `backend/app/Services/Payment/PaymentGatewayInterface.php` -- Ajout du contrat de méthode `payout()`.
- `backend/app/Services/Payment/SimulatedPaymentDriver.php` -- Implémentation du paiement Mobile Money sortant simulé.
- `backend/app/Http/Controllers/Api/WalletController.php` -- Controller REST pour la gestion du portefeuille et des retraits (`getBalance`, `withdraw`).
- `backend/routes/api.php` -- Routes `/v1/wallet/balance` et `/v1/wallet/withdraw`.
- `backend/tests/Feature/WalletWithdrawalTest.php` -- Suite de tests automatisés PHPUnit pour le calcul de solde et le retrait Mobile Money.

## Tasks & Acceptance

**Execution:**
- [x] `backend/app/Services/Payment/PaymentGatewayInterface.php` -- Ajouter la méthode `payout()`.
- [x] `backend/app/Services/Payment/SimulatedPaymentDriver.php` -- Implémenter `payout()`.
- [x] `backend/app/Http/Controllers/Api/WalletController.php` -- Implémenter `getBalance` et `withdraw`.
- [x] `backend/routes/api.php` -- Déclarer les routes du portefeuille.
- [x] `backend/tests/Feature/WalletWithdrawalTest.php` -- Créer la suite de tests d'intégration PHPUnit.

**Acceptance Criteria:**
- **Given** un contributeur avec un solde suffisant, **When** il soumet `POST /api/v1/wallet/withdraw`, **Then** le montant est transféré sur son Mobile Money et déduit immédiatement de son solde disponible.

## Design Notes

- Calcul de solde basé sur l'agrégation directe du grand livre d'écritures immuables `wallet_transactions`.

## Verification

**Commands:**
- `docker compose exec backend php artisan test --filter=WalletWithdrawalTest` -- expected: Tests PASS
- `curl -X POST http://localhost:8080/api/v1/wallet/withdraw -H "Authorization: Bearer MOBILE_TOKEN"` -- expected: HTTP 200 OK

## Suggested Review Order

**Contrôleur de Portefeuille & Driver Mobile Money**

- Implémentation du calcul de solde et du retrait
  [`WalletController.php:1`](../../backend/app/Http/Controllers/Api/WalletController.php#L1)

- Méthode payout dans le driver simulé
  [`SimulatedPaymentDriver.php:28`](../../backend/app/Services/Payment/SimulatedPaymentDriver.php#L28)

**Routes API V1**

- Enregistrement des routes `/v1/wallet/*`
  [`api.php:38`](../../backend/routes/api.php#L38)

**Suite de Tests Automatisés**

- Tests d'intégration du solde, du retrait Orange Money/Moov Money et des erreurs de solde insuffisant
  [`WalletWithdrawalTest.php:1`](../../backend/tests/Feature/WalletWithdrawalTest.php#L1)

