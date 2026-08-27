---
title: 'Story 5.1 : Portefeuille Contributeur & Demande de Retrait (>= 1 000 FCFA)'
type: 'feature'
created: '2026-08-27'
status: 'done'
baseline_commit: '157a759dc246e68fc9e4c9b1c59efc2e6b2b694b'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les contributeurs terrain ont besoin d'un portefeuille financier fiable et transparent pour visualiser leurs gains cumulés, suivre leurs soldes en attente de modération vs disponibles, et demander des virements vers leurs comptes Mobile Money locaux (Orange Money et Moov Money) dès le seuil de 1 000 FCFA. De plus, l'administration doit disposer d'un grand livre comptable immuable pour auditer tous les flux financiers de la marketplace.

**Approach:** Développer le module financier sous Laravel (`WalletService`, tables `wallets`, `wallet_transactions`, `withdrawal_requests`), intégrer le `SimulatedPaymentDriver` simulant les virements Mobile Money en temps réel (Orange Money / Moov Money au Burkina Faso), et connecter l'immuabilité du grand livre lors des validations de missions (manuelles et automatiques 48h). Côté Angular (`web-admin`), créer le module `/finances` avec tableau de bord des flux Mobile Money, historique des retraits et registre général des transactions.

## Boundaries & Constraints

**Always:**
- Respecter le seuil minimal de retrait fixé à **1 000 FCFA** (rejeter toute demande avec un code 422 si le montant < 1 000 FCFA).
- Garantir l'immuabilité stricte du registre comptable `wallet_transactions` (enregistrer systématiquement `balance_before` et `balance_after` sans jamais modifier ni supprimer une ligne existante).
- Verrouiller atomiquement la ligne de portefeuille (`lockForUpdate()`) pendant le traitement des débits et des crédits pour prévenir les doubles dépenses.
- Créditer automatiquement le solde disponible lors de chaque validation manuelle (`SubmissionAdminController`) ou automatique à 48h (`AutoValidationService`).
- Protéger les routes d'administration `/api/v1/admin/finances/*` par `auth:sanctum`.

**Ask First:**
- Modifier le seuil de retrait minimal de 1 000 FCFA.

**Never:**
- Ne jamais autoriser un retrait supérieur au solde disponible (`available_balance`).
- Ne jamais effacer ou écraser de transaction dans `wallet_transactions`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Demande de retrait valide | Contributeur solde 5 000 FCFA demande 2 000 FCFA vers Orange Money | `POST /api/v1/wallet/withdraw` -> Solde passe à 3 000 FCFA -> Réf `OM-BF-...` générée -> Inscription dans `wallet_transactions` | N/A |
| Demande < 1 000 FCFA | Clic retrait avec montant = 500 FCFA | Erreur 422 "Le seuil minimal de retrait est de 1 000 FCFA" | Transaction refusée |
| Solde insuffisant | Solde disponible = 2 000 FCFA, demande de 4 000 FCFA | Erreur 422 "Solde disponible insuffisant" | Transaction refusée |
| Validation de mission | Mission approuvée (rémunération: 3 000 FCFA) | Crédit automatique du wallet (`type: mission_earning`, montant: +3 000 FCFA) | N/A |
| Supervision Admin | Admin consulte `/finances` | Statistiques globales, répartition Orange vs Moov, liste des retraits et Grand Livre | N/A |

</frozen-after-approval>

## Code Map

- `backend/database/migrations/2026_08_27_000005_create_wallets_and_transactions_tables.php` -- Migration des tables `wallets`, `wallet_transactions`, `withdrawal_requests`.
- `backend/app/Models/Wallet.php` -- Modèle Eloquent du portefeuille.
- `backend/app/Models/WalletTransaction.php` -- Modèle Eloquent du grand livre immuable.
- `backend/app/Models/WithdrawalRequest.php` -- Modèle Eloquent des demandes de retrait Mobile Money.
- `backend/app/Models/User.php` -- Relations avec le portefeuille et les transactions.
- `backend/app/Services/Payment/PaymentDriverInterface.php` -- Interface du pilote de paiement.
- `backend/app/Services/Payment/SimulatedPaymentDriver.php` -- Pilote de simulation Orange Money & Moov Money.
- `backend/app/Services/WalletService.php` -- Moteur comptable, débits/crédits atomiques et seuil 1 000 FCFA.
- `backend/app/Http/Controllers/Api/V1/WalletController.php` -- Endpoints de consultation et retrait contributeur.
- `backend/app/Http/Controllers/Api/V1/Admin/FinanceAdminController.php` -- Endpoints de supervision administrative.
- `backend/routes/api.php` -- Définition des routes `/api/v1/wallet/*` et `/api/v1/admin/finances/*`.
- `backend/database/seeders/WalletSeeder.php` -- Seeder des portefeuilles et retraits de test.
- `backend/tests/Feature/WalletWithdrawalTest.php` -- Tests unitaires et fonctionnels du portefeuille.
- `web-admin/src/app/core/models/finance.model.ts` -- Types TypeScript financiers.
- `web-admin/src/app/core/services/finance-admin.service.ts` -- Service Angular de supervision financière.
- `web-admin/src/app/features/finances/finances-dashboard/` -- Tableau de bord des flux Mobile Money et registre comptable.

## Tasks & Acceptance

**Execution:**
- [x] `backend/database/migrations/2026_08_27_000005_create_wallets_and_transactions_tables.php` -- Créer le schéma de base de données relationnel -- Assurer la persistance du registre.
- [x] `backend/app/Models/Wallet.php`, `WalletTransaction.php`, `WithdrawalRequest.php` -- Créer les modèles Eloquent -- Structurer les entités financières.
- [x] `backend/app/Services/Payment/SimulatedPaymentDriver.php` -- Implémenter le driver de paiement pour Orange & Moov Money -- Permettre la simulation locale.
- [x] `backend/app/Services/WalletService.php` -- Développer la logique comptable avec verrous et seuil >= 1 000 FCFA -- Gérer les soldes.
- [x] `backend/app/Http/Controllers/Api/V1/WalletController.php` & `FinanceAdminController.php` -- Exposer les APIs REST -- Connecter les applications.
- [x] `backend/app/Http/Controllers/Api/V1/Admin/SubmissionAdminController.php` & `AutoValidationService.php` -- Lier les validations de missions au crédit immédiat du wallet -- Automatiser la rémunération.
- [x] `backend/database/seeders/WalletSeeder.php` -- Alimenter les données de test financières -- Permettre la validation des parcours.
- [x] `backend/tests/Feature/WalletWithdrawalTest.php` -- Rédiger les tests de non-régression -- Valider les invariants métier.
- [x] `web-admin/src/app/core/models/finance.model.ts` & `finance-admin.service.ts` -- Créer les modèles et services Angular -- Assurer le typage et l'état réactif.
- [x] `web-admin/src/app/features/finances/finances-dashboard/` -- Développer le tableau de bord financier et l'affichage du grand livre -- Offrir la supervision admin.

**Acceptance Criteria:**
- Given un contributeur avec un solde disponible >= 1 000 FCFA, when il demande un retrait vers Orange Money ou Moov Money, then son solde est décrémenté, une ligne est consignée dans `wallet_transactions` et la demande est enregistrée avec une référence réseau simulée.
- Given une tentative de retrait avec un montant < 1 000 FCFA, when soumise, then l'API retourne une erreur 422 et le solde reste inchangé.
- Given une soumission de mission validée manuellement ou auto-validée à 48h, when le statut passe à `validated`, then la rémunération de la mission est créditée sur le solde disponible du contributeur.
- Given un administrateur sur `/finances`, when la page se charge, then les volumes totaux reversés, les demandes de retrait et le grand livre comptable immuable s'affichent en direct.

## Verification

**Commands:**
- `npm run build` dans `web-admin` -- expected: `Application bundle generation complete` (0 erreur).
- `php -l` sur tous les fichiers backend modifiés et créés -- expected: 0 erreur.
