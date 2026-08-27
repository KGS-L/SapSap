---
title: 'Story 3.3 & 3.4: Contrôle de Proximité GPS (100m), Anti-Fraude & Soumission de Preuves'
type: 'feature'
created: '2026-08-26'
status: 'done'
baseline_commit: 'eb1fe8c8f00078b5ce2a5ff5aaedb0bd1eb22fb4'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les soumissions de missions par les contributeurs mobiles doivent impérativement être vérifiées géographiquement (rayon de géofencing strict de 100 mètres autour du point d'enquête), comporter des photos et réponses valides, et générer une empreinte numérique anti-fraude SHA-256 (`submission_hash`).

**Approach:** Créer la migration de la table `submissions` et le modèle `Submission`, implémenter l'endpoint `POST /api/v1/missions/{id}/submit` dans `MobileMissionController`, et ajouter la suite de tests `MobileMissionSubmissionTest.php`.

## Boundaries & Constraints

**Always:**
- Exiger une réservation active attribuée à l'utilisateur connecté (`status = assigned` et `assigned_user_id = user.id`).
- Calculer la distance Haversine exacte en mètres entre les coordonnées GPS envoyées et l'emplacement de la mission.
- Rejeter HTTP 422 si la distance calculée dépasse `radius_meters` (100 mètres par défaut).
- Valider la présence d'au moins `required_photos_count` photos et des réponses au questionnaire.
- Calculer et stocker l'empreinte SHA-256 `hash('sha256', user_id + mission_id + device_id + timestamp)`.
- Mettre à jour le statut de la mission de `assigned` à `submitted` et créer l'enregistrement `submissions` au statut `pending_review`.

**Ask First:**
- Modifier la tolérance de distance au-delà de 100 mètres.

**Never:**
- Accepter une soumission géographiquement hors périmètre (> 100m).
- Accepter une soumission d'une mission non réservée ou expirée.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Soumission Conforme (Distance <= 100m) | POST `/api/v1/missions/{id}/submit` avec lat/lng valides (< 100m), photos et réponses | `{ "success": true, "message": "Mission soumise avec succès", "data": { "submission_id": 1, "status": "pending_review", "submission_hash": "..." } }` | HTTP 201 Created |
| Soumission Hors Périmètre (Distance > 100m) | POST avec coordonnées GPS éloignées (ex: 250m) | `{ "success": false, "message": "Proximité insuffisante. Vous devez être à moins de 100m du lieu de la mission." }` | HTTP 422 Unprocessable Entity |
| Mission Non Réservée par l'Utilisateur | POST sur mission attribuée à un autre utilisateur | `{ "success": false, "message": "Vous n'avez pas réservé cette mission." }` | HTTP 422 Unprocessable Entity |

</frozen-after-approval>

## Code Map

- `backend/database/migrations/2026_08_26_204500_create_submissions_table.php` -- Migration de la table `submissions` (champs GPS, empreinte SHA-256, réponses JSON, URLs photos, statut `pending_review`).
- `backend/app/Models/Submission.php` -- Modèle Eloquent `Submission` avec relations et casts JSON.
- `backend/app/Http/Controllers/Api/MobileMissionController.php` -- Ajout de la méthode `submit` avec calcul Haversine 100m et hachage anti-fraude.
- `backend/routes/api.php` -- Route `POST /v1/missions/{id}/submit`.
- `backend/tests/Feature/MobileMissionSubmissionTest.php` -- Suite de tests automatisés PHPUnit pour la validation 100m et la soumission.

## Tasks & Acceptance

**Execution:**
- [x] `backend/database/migrations/2026_08_26_204500_create_submissions_table.php` -- Créer la migration `submissions`.
- [x] `backend/app/Models/Submission.php` -- Créer le modèle Eloquent `Submission`.
- [x] `backend/app/Http/Controllers/Api/MobileMissionController.php` -- Implémenter la méthode `submit` avec contrôle Haversine <= 100m.
- [x] `backend/routes/api.php` -- Enregistrer la route `POST /v1/missions/{id}/submit`.
- [x] `backend/tests/Feature/MobileMissionSubmissionTest.php` -- Créer la suite de tests automatisés PHPUnit.

**Acceptance Criteria:**
- **Given** une mission réservée par un contributeur, **When** il envoie POST `/api/v1/missions/{id}/submit` depuis un emplacement situé à moins de 100 mètres, **Then** la soumission est acceptée, l'empreinte SHA-256 enregistrée et la mission passe au statut `submitted`.

## Design Notes

- Formule de distance Haversine en mètres : $d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}\right) \cdot 1000$.

## Verification

**Commands:**
- `docker compose exec backend php artisan migrate --force` -- expected: Migration SUCCESS
- `docker compose exec backend php artisan test --filter=MobileMissionSubmissionTest` -- expected: Tests PASS
- `curl -X POST http://localhost:8080/api/v1/missions/1/submit -H "Authorization: Bearer MOBILE_TOKEN"` -- expected: HTTP 201 Created

## Suggested Review Order

**Méthode de Soumission Mobile & Contrôle 100m**

- Implémentation du calcul Haversine 100m, empreinte SHA-256 et statut submitted
  [`MobileMissionController.php:120`](../../backend/app/Http/Controllers/Api/MobileMissionController.php#L120)

**Modèle & Migration Submission**

- Migration de la table submissions
  [`2026_08_26_204500_create_submissions_table.php:1`](../../backend/database/migrations/2026_08_26_204500_create_submissions_table.php#L1)

- Model Eloquent Submission
  [`Submission.php:1`](../../backend/app/Models/Submission.php#L1)

**Routes API V1**

- Enregistrement du endpoint `POST /v1/missions/{id}/submit`
  [`api.php:42`](../../backend/routes/api.php#L42)

**Suite de Tests Automatisés**

- Tests d'intégration du rejet hors périmètre (>100m), du succès (<100m) et de la vérification d'attribution
  [`MobileMissionSubmissionTest.php:1`](../../backend/tests/Feature/MobileMissionSubmissionTest.php#L1)

