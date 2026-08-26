---
title: 'Story 3.1 & 3.2: Découverte & Réservation Temporaire de Missions (Mobile API)'
type: 'feature'
created: '2026-08-26'
status: 'done'
baseline_commit: '39ede1c4eead1d7ffc1d7bfd1ed9af9e7eecfd37'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les contributeurs doivent pouvoir consulter les missions géolocalisées disponibles à Ouagadougou et réserver une mission de leur choix avec un verrou exclusif temporaire de 45 minutes pour éviter les conflits d'exécution.

**Approach:** Créer le contrôleur `MobileMissionController` avec les endpoints `GET /api/v1/missions`, `POST /api/v1/missions/{id}/reserve` et `POST /api/v1/missions/{id}/cancel-reservation`, et ajouter la suite de tests `MobileMissionReservationTest.php`.

## Boundaries & Constraints

**Always:**
- Exiger une authentification Sanctum valide avec rôle `contributor`.
- Calculer la distance en kilomètres par rapport aux coordonnées GPS fournies ou au centre de Ouagadougou.
- Fixer la durée d'expiration de réservation exactement à 45 minutes (`expires_at = now() + 45 minutes`).
- Empêcher un contributeur de réserver une deuxième mission s'il en a déjà une active en cours d'expiration.
- Gérer l'expiration automatique des verrous 45 minutes dont le délai est dépassé (libération au statut `available`).

**Ask First:**
- Modifier la durée par défaut du verrou de réservation (45 min).

**Never:**
- Permettre la réservation d'une mission déjà réservée ou expirée par un autre contributeur.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Liste Missions Disponibles | GET `/api/v1/missions?lat=12.3714&lng=-1.5197` | `{ "success": true, "data": [ { "id": 1, "title": "...", "distance_km": 0.35, "status": "available" } ] }` | HTTP 200 OK |
| Réservation Réussie | POST `/api/v1/missions/{id}/reserve` sur mission `available` | `{ "success": true, "message": "Mission réservée pour 45 minutes", "data": { "expires_at": "...", "status": "assigned" } }` | HTTP 200 OK |
| Double Réservation Interdite | POST `/api/v1/missions/{id2}/reserve` avec réservation active | `{ "success": false, "message": "Vous avez déjà une mission réservée en cours." }` | HTTP 422 Unprocessable Entity |
| Annulation Réservation | POST `/api/v1/missions/{id}/cancel-reservation` | `{ "success": true, "message": "Réservation annulée" }` | HTTP 200 OK |

</frozen-after-approval>

## Code Map

- `backend/app/Http/Controllers/Api/MobileMissionController.php` -- Controller REST pour la découverte et réservation de missions mobile (`index`, `reserve`, `cancelReservation`).
- `backend/routes/api.php` -- Enregistrement des routes `/v1/missions` et `/v1/missions/{id}/reserve`.
- `backend/tests/Feature/MobileMissionReservationTest.php` -- Suite de tests automatisés PHPUnit pour la découverte et le verrouillage 45 min.

## Tasks & Acceptance

**Execution:**
- [x] `backend/app/Http/Controllers/Api/MobileMissionController.php` -- Créer `MobileMissionController` -- Implémenter `index` (avec calcul distance Haversine), `reserve` (verrou 45 min) et `cancelReservation`.
- [x] `backend/routes/api.php` -- Enregistrer les routes `/v1/missions` sous `auth:sanctum`.
- [x] `backend/tests/Feature/MobileMissionReservationTest.php` -- Créer les tests d'intégration PHPUnit pour le verrou 45 min et l'isolation.

**Acceptance Criteria:**
- **Given** un contributeur mobile, **When** il soumet `POST /api/v1/missions/{id}/reserve`, **Then** la mission passe à `assigned` avec un verrou de 45 minutes et aucune autre réservation n'est autorisée tant que la mission est verrouillée.

## Design Notes

- Libération automatique des réservations périmées (`expires_at < now()`) exécutée en amont de chaque recherche/réservation.

## Verification

**Commands:**
- `docker compose exec backend php artisan test --filter=MobileMissionReservationTest` -- expected: Tests PASS
- `curl -X POST http://localhost:8080/api/v1/missions/1/reserve -H "Authorization: Bearer MOBILE_TOKEN"` -- expected: HTTP 200 OK

## Suggested Review Order

**Contrôleur de Découverte & Réservation Mobile**

- Implémentation du tri par distance Haversine, verrouillage 45 min et purge auto
  [`MobileMissionController.php:1`](../../backend/app/Http/Controllers/Api/MobileMissionController.php#L1)

**Routes API V1**

- Enregistrement des endpoints `/v1/missions` et `/v1/missions/{id}/reserve`
  [`api.php:38`](../../backend/routes/api.php#L38)

**Suite de Tests Automatisés**

- Tests d'intégration du verrou 45 min, de la purge d'expiration et du blocage de double réservation
  [`MobileMissionReservationTest.php:1`](../../backend/tests/Feature/MobileMissionReservationTest.php#L1)

