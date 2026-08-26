---
title: 'Story 2.1: Wizard de Création de Campagne sur Portail Business'
type: 'feature'
created: '2026-08-26'
status: 'done'
baseline_commit: 'a8fb9fd60eb4ce415b3dfac16f272a2a0d16be95'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les entreprises ont besoin d'une API REST backend permettant de créer, modifier et consulter leurs campagnes de missions en statut `draft` avant la phase de règlement et modération.

**Approach:** Créer la migration de la table `campaigns` et le modèle Eloquent `Campaign`, implémenter les endpoints API REST `/api/v1/business/campaigns` (POST, GET, GET /{id}, PUT /{id}) réservés aux rôles `company-admin` et `company-viewer`, et créer la suite de tests `CampaignWizardTest.php`.

## Boundaries & Constraints

**Always:**
- Exiger le rôle Spatie `company-admin` ou `company-viewer` via Sanctum.
- Valider le type de mission (`verification`, `audit`, `mystery_shopper`, `pricing`), le nombre de missions requested (>= 1) et le montant de la récompense par mission (>= 500 FCFA).
- Enregistrer le questionnaire sous forme de tableau JSON valide.
- Initialiser la campagne au statut `draft`.
- Calculer le sous-total (`reward_per_mission * total_missions_requested`), la commission SapSap (15% par défaut) et le budget total.

**Ask First:**
- Modification du taux de commission par défaut de la plateforme SapSap (15%).

**Never:**
- Permettre à une entreprise de consulter ou modifier les campagnes d'une autre entreprise (`company_id` isolé).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Création Campagne Valide | POST `/api/v1/business/campaigns` avec titre, type, récompense, nombre missions | `{ "success": true, "data": { "id": "...", "status": "draft", "total_budget_amount": ... } }` | HTTP 201 Created |
| Validation Paramètres Échec | POST avec récompense < 500 FCFA ou nombre missions < 1 | `{ "success": false, "message": "Erreur de validation", "errors": [...] }` | HTTP 422 Unprocessable Entity |
| Isolation des Entreprises | Entreprise A demandant la campagne de l'Entreprise B | `{ "success": false, "message": "Campagne non trouvée" }` | HTTP 404 Not Found |
| Rôle Invalide | Utilisateur avec rôle `contributor` tentant de créer une campagne | `{ "success": false, "message": "Accès refusé" }` | HTTP 403 Forbidden |

</frozen-after-approval>

## Code Map

- `backend/database/migrations/2026_08_26_203000_create_campaigns_table.php` -- Migration de la table `campaigns` (champs d'objectifs, localisation, questionnaire JSON, montants FCFA, statut).
- `backend/app/Models/Campaign.php` -- Modèle Eloquent `Campaign` avec relations et casting JSON/integer.
- `backend/app/Http/Controllers/Api/Business/CampaignController.php` -- Controller REST Business pour la gestion du CRUD des campagnes (`store`, `index`, `show`, `update`).
- `backend/routes/api.php` -- Enregistrement des routes `/v1/business/campaigns` sous middleware `auth:sanctum` et `role:company-admin|company-viewer|super-admin`.
- `backend/tests/Feature/CampaignWizardTest.php` -- Suite de tests automatisés PHPUnit pour la création et la gestion des campagnes Business.

## Tasks & Acceptance

**Execution:**
- [x] `backend/database/migrations/2026_08_26_203000_create_campaigns_table.php` -- Créer la migration `campaigns` -- Ajouter UUID, `company_id`, `mission_type`, `questionnaire_schema`, montants FCFA et `status`.
- [x] `backend/app/Models/Campaign.php` -- Créer le modèle `Campaign` -- Configurer fillables, casts (`questionnaire_schema` => `array`) et la relation `belongsTo(User::class, 'company_id')`.
- [x] `backend/app/Http/Controllers/Api/Business/CampaignController.php` -- Créer `CampaignController` -- Implémenter les méthodes `store`, `index`, `show`, `update`.
- [x] `backend/routes/api.php` -- Déclarer les routes Business -- Ajouter `/v1/business/campaigns`.
- [x] `backend/tests/Feature/CampaignWizardTest.php` -- Créer les tests d'intégration PHPUnit pour le wizard de création de campagne.

**Acceptance Criteria:**
- **Given** un responsable d'entreprise authentifié (`company-admin`), **When** il soumet les détails de sa campagne via POST `/api/v1/business/campaigns`, **Then** la campagne est enregistrée en statut `draft` avec le calcul automatique du sous-total, commission SapSap et budget total.
- **Given** une entreprise A, **When** elle demande la liste de ses campagnes via GET `/api/v1/business/campaigns`, **Then** seules ses propres campagnes sont retournées.

## Design Notes

- Taux de commission SapSap fixé à 15% (`platform_fee_amount = round(subtotal_amount * 0.15)`).

## Verification

**Commands:**
- `docker compose exec backend php artisan migrate --force` -- expected: Migration SUCCESS
- `docker compose exec backend php artisan test --filter=CampaignWizardTest` -- expected: Tests PASS
- `curl -X POST http://localhost:8080/api/v1/business/campaigns -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"title": "Audit Boutique 1", "mission_type": "audit", "reward_per_mission": 2000, "total_missions_requested": 10}'` -- expected: HTTP 201 Created

## Suggested Review Order

**Contrôleur des Campagnes Business**

- Implémentation du CRUD de campagne et calculs automatiques FCFA / commission
  [`CampaignController.php:1`](../../backend/app/Http/Controllers/Api/Business/CampaignController.php#L1)

**Modèle & Migration Campagnes**

- Migration de la table campaigns
  [`2026_08_26_203000_create_campaigns_table.php:1`](../../backend/database/migrations/2026_08_26_203000_create_campaigns_table.php#L1)

- Model Eloquent Campaign
  [`Campaign.php:1`](../../backend/app/Models/Campaign.php#L1)

**Routes API V1**

- Enregistrement des endpoints `/v1/business/campaigns`
  [`api.php:36`](../../backend/routes/api.php#L36)

**Tests d'Intégration**

- Tests automatisés de création, isolation inter-entreprises et recalculs budgétaires
  [`CampaignWizardTest.php:1`](../../backend/tests/Feature/CampaignWizardTest.php#L1)

