---
title: 'Story 4.2, 4.3 & 4.4: Revue Admin des Soumissions, Rémunération, Anti-Fraude & Auto-Validation 48h'
type: 'feature'
created: '2026-08-26'
status: 'done'
baseline_commit: '4c1c7bf141ecf4ffae0ecbc8cfd84d6af1f3a2c5'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les soumissions en attente (`pending_review`) doivent pouvoir être examinées par l'administrateur pour valider la rémunération du contributeur (crédit dans `wallet_transactions`, +1 mission accomplie, +2 réputation) ou rejeter la preuve (remise en disponibilité de la mission, penalty -5 réputation), avec un job planifié d'auto-validation à 48h.

**Approach:** Implémenter le contrôleur `AdminSubmissionController` (`index`, `approve`, `reject`), la commande Artisan `AutoValidateSubmissionsCommand` (`missions:auto-validate`), les routes Admin sous `role:super-admin|validator`, et créer la suite de tests `AdminSubmissionReviewTest.php`.

## Boundaries & Constraints

**Always:**
- Exiger le rôle Spatie `super-admin` ou `validator`.
- Lors de l'approbation d'une soumission :
  - Passer le statut de la soumission à `approved` et de la mission à `validated`.
  - Créer la transaction de rémunération `contributor_payout` (`status = released`) dans `wallet_transactions`.
  - Ajuster la réputation du contributeur (`reputation_score` +2, max 100) et incrémenter `completed_missions_count` (+1).
- Lors du rejet d'une soumission :
  - Passer le statut de la soumission à `rejected` avec enregistrement de `rejection_reason`.
  - Réinitialiser la mission au statut `available` (libérée sans utilisateur attribué).
  - Appliquer une pénalité sur le réputation score du contributeur (-5 points, min 0).
- La commande Artisan `missions:auto-validate` doit auto-valider toutes les soumissions `pending_review` créées il y a plus de 48 heures.

**Ask First:**
- Modifier la valeur des récompenses de réputation (+2 / -5) ou la durée du délai d'auto-validation (48h).

**Never:**
- Permettre la ré-approbation d'une soumission déjà approuvée ou rejetée.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Approbation Soumission | POST `/api/v1/admin/submissions/{id}/approve` | `{ "success": true, "message": "Soumission approuvée et rémunération créditée", "data": { "submission_status": "approved", "payout_amount": 2000 } }` | HTTP 200 OK |
| Rejet Soumission avec Motif | POST `/api/v1/admin/submissions/{id}/reject` avec `{ "rejection_reason": "Photo floue" }` | `{ "success": true, "message": "Soumission rejetée", "data": { "submission_status": "rejected", "mission_status": "available" } }` | HTTP 200 OK |
| Auto-Validation 48h | Commande `php artisan missions:auto-validate` avec soumission vieille de 49h | 1 soumission auto-approuvée, transaction `contributor_payout` générée | SUCCESS |

</frozen-after-approval>

## Code Map

- `backend/app/Http/Controllers/Api/Admin/AdminSubmissionController.php` -- Controller REST Admin pour la revue manuelle (`index`, `approve`, `reject`).
- `backend/app/Console/Commands/AutoValidateSubmissionsCommand.php` -- Commande Artisan `missions:auto-validate` pour l'auto-validation automatique des soumissions > 48h.
- `backend/routes/api.php` -- Enregistrement des routes `/v1/admin/submissions/*`.
- `backend/tests/Feature/AdminSubmissionReviewTest.php` -- Suite de tests automatisés PHPUnit pour la revue des soumissions, rémunération et auto-validation.

## Tasks & Acceptance

**Execution:**
- [x] `backend/app/Http/Controllers/Api/Admin/AdminSubmissionController.php` -- Implémenter `index`, `approve` (paiement transaction + réputation) et `reject` (remise disponible + pénalité).
- [x] `backend/app/Console/Commands/AutoValidateSubmissionsCommand.php` -- Créer la commande Artisan `missions:auto-validate`.
- [x] `backend/routes/api.php` -- Déclarer les routes Admin pour la gestion des soumissions.
- [x] `backend/tests/Feature/AdminSubmissionReviewTest.php` -- Créer la suite de tests d'intégration PHPUnit.

**Acceptance Criteria:**
- **Given** une soumission `pending_review`, **When** l'administrateur approuve ou que 48h s'écoulent, **Then** la soumission est validée, le solde/score du contributeur est incrémenté et la transaction de paiement est consignée en base.

## Design Notes

- Traitement encapsulé dans des transactions de base de données `DB::transaction()` atomiques.

## Verification

**Commands:**
- `docker compose exec backend php artisan test --filter=AdminSubmissionReviewTest` -- expected: Tests PASS
- `docker compose exec backend php artisan missions:auto-validate` -- expected: SUCCESS
- `curl -X POST http://localhost:8080/api/v1/admin/submissions/1/approve -H "Authorization: Bearer ADMIN_TOKEN"` -- expected: HTTP 200 OK

## Suggested Review Order

**Contrôleur de Revue Admin & Paiement**

- Implémentation des méthodes approve, reject et index
  [`AdminSubmissionController.php:1`](../../backend/app/Http/Controllers/Api/Admin/AdminSubmissionController.php#L1)

**Commande Artisan d'Auto-Validation 48h**

- Commande Artisan `missions:auto-validate`
  [`AutoValidateSubmissionsCommand.php:1`](../../backend/app/Console/Commands/AutoValidateSubmissionsCommand.php#L1)

**Routes API V1**

- Enregistrement des routes `/v1/admin/submissions/*`
  [`api.php:79`](../../backend/routes/api.php#L79)

**Suite de Tests Automatisés**

- Tests d'intégration de l'approbation, du rejet avec pénalité et du job 48h
  [`AdminSubmissionReviewTest.php:1`](../../backend/tests/Feature/AdminSubmissionReviewTest.php#L1)

