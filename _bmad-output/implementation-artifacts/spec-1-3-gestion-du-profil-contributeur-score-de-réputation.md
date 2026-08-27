---
title: 'Story 1.3: Gestion du Profil Contributeur & Score de Réputation'
type: 'feature'
created: '2026-08-26'
status: 'done'
baseline_commit: '42da8fc5742fd8a38f01e224b5d779b5d2265d21'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les contributeurs doivent pouvoir consulter leur profil complet (nom, prénom, quartier, date d'inscription, score de réputation SapSap, nombre de missions accomplies) et mettre à jour leurs coordonnées personnelles de manière sécurisée via l'API REST.

**Approach:** Étendre le schéma de la table `users` et le modèle `User`, créer le contrôleur `ProfileController` avec les endpoints REST protégés par Sanctum `GET /api/v1/profile` et `PUT /api/v1/profile`, et ajouter la suite de tests `ProfileTest.php`.

## Boundaries & Constraints

**Always:**
- Exiger une authentification Bearer Sanctum valide (`auth:sanctum`).
- Valider les données reçues sur `PUT /api/v1/profile` (`first_name`, `last_name`, `district`, `city`).
- Retourner une enveloppe JSON uniforme : `{ "success": boolean, "data": object|array, "message": string, "errors": array|null }`.
- Préserver le `reputation_score` et `completed_missions_count` en lecture seule (non modifiables directement par l'utilisateur).

**Ask First:**
- Modification de l'algorithme de calcul de réputation ou remise à zéro des scores.

**Never:**
- Permettre la modification arbitraire du `reputation_score` via le formulaire de profil.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lecture Profil Succès | Token Sanctum Valide (GET `/api/v1/profile`) | `{ "success": true, "data": { "phone_number": "...", "reputation_score": 100, ... } }` | N/A |
| Mise à Jour Profil Succès | PUT `/api/v1/profile` avec `{ "first_name": "Jean", "last_name": "Kabore", "district": "Koulouba", "city": "Ouagadougou" }` | `{ "success": true, "data": { "first_name": "Jean", ... }, "message": "Profil mis à jour" }` | N/A |
| Tentative Modif Score Réputation | PUT `/api/v1/profile` avec `{ "reputation_score": 500 }` | Le score reste inchangé (100). Seules les coordonnées sont modifiées. | N/A (Ignoré) |
| Non Authentifié | Requête sans token Bearer | `{ "message": "Unauthenticated." }` | HTTP 401 Unauthorized |

</frozen-after-approval>

## Code Map

- `backend/database/migrations/0001_01_01_000000_create_users_table.php` -- Ajout des colonnes `first_name`, `last_name`, `district`, `city`, `completed_missions_count`.
- `backend/app/Models/User.php` -- Modèle `User` mis à jour avec les nouveaux champs `$fillable`.
- `backend/app/Http/Controllers/Api/ProfileController.php` -- Contrôleur API REST pour `show` (GET) et `update` (PUT) du profil utilisateur.
- `backend/routes/api.php` -- Enregistrement des routes `/v1/profile` sous le middleware `auth:sanctum`.
- `backend/tests/Feature/ProfileTest.php` -- Suite de tests automatisés pour le profil et le score de réputation.

## Tasks & Acceptance

**Execution:**
- [x] `backend/database/migrations/0001_01_01_000000_create_users_table.php` -- Ajouter `first_name`, `last_name`, `district`, `city`, `completed_missions_count` (default 0).
- [x] `backend/app/Models/User.php` -- Ajouter les nouveaux champs au tableau `$fillable` du modèle.
- [x] `backend/app/Http/Controllers/Api/ProfileController.php` -- Créer `ProfileController` -- Implémenter les méthodes `show` et `update`.
- [x] `backend/routes/api.php` -- Ajouter les routes GET/PUT `/v1/profile` protégées par Sanctum.
- [x] `backend/tests/Feature/ProfileTest.php` -- Créer les tests automatisés PHPUnit pour la consultation et la mise à jour du profil.

**Acceptance Criteria:**
- **Given** un contributeur connecté, **When** il envoie une requête GET sur `/api/v1/profile`, **Then** l'API retourne HTTP 200 avec ses données de profil, son score de réputation et son nombre de missions accomplies.
- **Given** un contributeur connecté, **When** il envoie PUT `/api/v1/profile` avec de nouvelles coordonnées, **Then** les informations sont validées et mises à jour en base PostgreSQL.

## Design Notes

- Le score de réputation est initialisé à 100 par défaut et sera incrémenté/décrémenté par le module de modération et soumission (Epic 4).

## Verification

**Commands:**
- `docker compose exec backend php artisan migrate:fresh --seed --force` -- expected: SUCCESS
- `docker compose exec backend php artisan test --filter=ProfileTest` -- expected: Tests PASS
- `curl -X GET http://localhost:8080/api/v1/profile -H "Authorization: Bearer TOKEN"` -- expected: HTTP 200 OK

## Suggested Review Order

**Contrôleur de Profil REST**

- Implémentation de show() et update() sécurisés
  [`ProfileController.php:1`](../../backend/app/Http/Controllers/Api/ProfileController.php#L1)

**Routes API V1**

- Enregistrement des endpoints `/v1/profile`
  [`api.php:27`](../../backend/routes/api.php#L27)

**Modèle & Migration Utilisateur**

- Extension de la table users avec les champs de profil et réputation
  [`0001_01_01_000000_create_users_table.php:14`](../../backend/database/migrations/0001_01_01_000000_create_users_table.php#L14)

- Model User mis à jour
  [`User.php:23`](../../backend/app/Models/User.php#L23)

**Tests d'Intégration**

- Tests automatisés GET et PUT profil avec protection réputation
  [`ProfileTest.php:1`](../../backend/tests/Feature/ProfileTest.php#L1)

