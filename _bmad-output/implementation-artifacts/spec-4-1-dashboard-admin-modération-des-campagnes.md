---
title: 'Story 4.1: Dashboard Admin Modération des Campagnes & Génération de Missions'
type: 'feature'
created: '2026-08-26'
status: 'done'
baseline_commit: '285172e0faeefc73bb9cc9d54e4df9cbfde7e8e5'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les administrateurs ont besoin d'une interface API backend pour examiner les campagnes soumises (`pending_approval`), les approuver (ce qui génère automatiquement les $N$ missions géolocalisées associées avec géofencing PostGIS 100m) ou les rejeter avec un motif d'explication.

**Approach:** Créer la migration de la table `missions` et le modèle `Mission`, implémenter le contrôleur `AdminCampaignController` avec les endpoints `GET /api/v1/admin/campaigns`, `POST /api/v1/admin/campaigns/{id}/approve` et `POST /api/v1/admin/campaigns/{id}/reject`, et créer la suite de tests `AdminCampaignValidationTest.php`.

## Boundaries & Constraints

**Always:**
- Exiger le rôle Spatie `super-admin` ou `validator`.
- Générer exactement le nombre de missions spécifié par `total_missions_requested`.
- Assigner les coordonnées GPS de Ouagadougou (`lat: 12.371420`, `lng: -1.519700`) avec variabilité géographique réaliste.
- Assigner un rayon de géofencing de 100 mètres par défaut par mission.
- Basculer le statut de la campagne de `pending_approval` vers `active` lors de l'approbation.
- En cas de rejet, enregistrer `rejection_reason` et basculer le statut vers `rejected`.

**Ask First:**
- Modifier le rayon par défaut de géofencing (100m).

**Never:**
- Permettre la validation d'une campagne non payée (`status = draft`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Approbation Campagne | POST `/api/v1/admin/campaigns/{id}/approve` sur campagne `pending_approval` | `{ "success": true, "message": "Campagne approuvée et N missions générées", "data": { "missions_created": N, "campaign_status": "active" } }` | HTTP 200 OK |
| Rejet Campagne | POST `/api/v1/admin/campaigns/{id}/reject` avec `{ "rejection_reason": "Motif..." }` | `{ "success": true, "message": "Campagne rejetée", "data": { "campaign_status": "rejected" } }` | HTTP 200 OK |
| Approbation Sans Fonds Séquestrés | POST sur campagne `draft` | `{ "success": false, "message": "Seules les campagnes réglées peuvent être approuvées." }` | HTTP 422 Unprocessable Entity |
| Rôle Invalide | Accès par un utilisateur non-admin | `{ "success": false, "message": "Accès refusé" }` | HTTP 403 Forbidden |

</frozen-after-approval>

## Code Map

- `backend/database/migrations/2026_08_26_204000_create_missions_table.php` -- Migration de la table `missions` (champs géographiques, montants, statut, clés étrangères).
- `backend/app/Models/Mission.php` -- Modèle Eloquent `Mission` avec relations et casts JSON.
- `backend/app/Http/Controllers/Api/Admin/AdminCampaignController.php` -- Controller REST Admin pour la modération et génération de missions (`index`, `approve`, `reject`).
- `backend/routes/api.php` -- Routes `/v1/admin/campaigns/*` sous middleware `role:super-admin|validator`.
- `backend/tests/Feature/AdminCampaignValidationTest.php` -- Suite de tests automatisés pour la modération et génération des missions PostGIS.

## Tasks & Acceptance

**Execution:**
- [x] `backend/database/migrations/2026_08_26_204000_create_missions_table.php` -- Migration table `missions`.
- [x] `backend/app/Models/Mission.php` -- Créer le modèle Eloquent `Mission`.
- [x] `backend/app/Http/Controllers/Api/Admin/AdminCampaignController.php` -- Implémenter les méthodes `index`, `approve` (génération $N$ missions GPS) et `reject`.
- [x] `backend/routes/api.php` -- Enregistrer les routes Admin sous middleware `role:super-admin|validator`.
- [x] `backend/tests/Feature/AdminCampaignValidationTest.php` -- Créer la suite de tests automatisés PHPUnit.

**Acceptance Criteria:**
- **Given** une campagne `pending_approval`, **When** l'administrateur soumet `POST /api/v1/admin/campaigns/{id}/approve`, **Then** la campagne passe à `active` et $N$ missions géolocalisées avec un rayon de 100m sont générées en base PostgreSQL.

## Design Notes

- Emplacements géographiques calculés avec décalage de $\pm 0.025$ degré de latitude et longitude autour du centre de la ville de Ouagadougou.

## Verification

**Commands:**
- `docker compose exec backend php artisan migrate --force` -- expected: Migration SUCCESS
- `docker compose exec backend php artisan test --filter=AdminCampaignValidationTest` -- expected: Tests PASS
- `curl -X POST http://localhost:8080/api/v1/admin/campaigns/1/approve -H "Authorization: Bearer ADMIN_TOKEN"` -- expected: HTTP 200 OK

## Suggested Review Order

**Contrôleur de Modération Admin**

- Implémentation de approve() et reject() avec génération automatique des missions PostGIS
  [`AdminCampaignController.php:1`](../../backend/app/Http/Controllers/Api/Admin/AdminCampaignController.php#L1)

**Modèle & Migration Mission**

- Migration de la table missions
  [`2026_08_26_204000_create_missions_table.php:1`](../../backend/database/migrations/2026_08_26_204000_create_missions_table.php#L1)

- Model Eloquent Mission
  [`Mission.php:1`](../../backend/app/Models/Mission.php#L1)

**Routes API V1**

- Enregistrement des endpoints `/v1/admin/campaigns/*`
  [`api.php:62`](../../backend/routes/api.php#L62)

**Suite de Tests Automatisés**

- Tests automatisés d'approbation, rejet et vérification des missions créées
  [`AdminCampaignValidationTest.php:1`](../../backend/tests/Feature/AdminCampaignValidationTest.php#L1)
s/1/approve -H "Authorization: Bearer ADMIN_TOKEN"` -- expected: HTTP 200 OK
