---
title: 'Story 1.2: Authentification Web Business & Admin avec Spatie RBAC'
type: 'feature'
created: '2026-08-26'
status: 'done'
baseline_commit: 'a50169d0fe052a1a01cbdaee2021832bbb6651e5'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les représentants d'entreprises et les administrateurs doivent pouvoir se connecter sur l'API backend via leur email et mot de passe, et obtenir leurs jetons d'accès Sanctum associés à leurs rôles Spatie RBAC spécifiques (`super-admin`, `validator`, `company-admin`, `company-viewer`).

**Approach:** Implémenter les endpoints API REST `/api/v1/auth/web/login`, `/api/v1/auth/web/logout` et configurer le seeder de rôles/utilisateurs initiaux (`RolesAndPermissionsSeeder`), ainsi qu'un middleware de protection Spatie RBAC testé par des routes d'exemple protégées retournant HTTP 403 en cas d'accès non autorisé.

## Boundaries & Constraints

**Always:**
- Valider le format de l'adresse email et exiger un mot de passe non vide.
- Vérifier les mots de passe hachés via `Hash::check()`.
- Utiliser Spatie `spatie/laravel-permission` pour associer les rôles (`super-admin`, `validator`, `company-admin`, `company-viewer`).
- Retourner une enveloppe JSON uniforme : `{ "success": boolean, "data": object|array, "message": string, "errors": array|null }`.
- Retourner HTTP 403 Forbidden lorsqu'un utilisateur sans le rôle approprié tente d'accéder à une route protégée.

**Ask First:**
- Modification des noms des rôles Spatie ou suppression d'un rôle existant.

**Never:**
- Retourner les mots de passe hachés dans les réponses API.
- Permettre la connexion avec des identifiants invalides sans retourner HTTP 401 Unauthorized.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Connexion Web Valide | `{ "email": "admin@sapsap.bf", "password": "password" }` | `{ "success": true, "data": { "token": "...", "roles": ["super-admin"] } }` | N/A |
| Identifiants Invalides | `{ "email": "admin@sapsap.bf", "password": "wrongpassword" }` | `{ "success": false, "message": "Identifiants invalides" }` | HTTP 401 Unauthorized |
| Validation Formulaire Échec | `{ "email": "invalide-email", "password": "" }` | `{ "success": false, "message": "Erreur de validation", "errors": [...] }` | HTTP 422 Unprocessable Entity |
| Accès Route Protegée par Rôle (Sans Rôle) | Token d'un utilisateur `company-viewer` sur route `role:super-admin` | `{ "success": false, "message": "User does not have the right roles." }` | HTTP 403 Forbidden |

</frozen-after-approval>

## Code Map

- `backend/database/seeders/RolesAndPermissionsSeeder.php` -- Seeder créant les 5 rôles Spatie (`super-admin`, `validator`, `company-admin`, `company-viewer`, `contributor`) et les comptes de test admin/business.
- `backend/app/Http/Controllers/Api/Auth/WebAuthController.php` -- Controller REST pour la connexion (`login`), la déconnexion (`logout`) et la récupération du profil web.
- `backend/routes/api.php` -- Routes `/v1/auth/web/login`, `/v1/auth/web/logout` et routes de test RBAC `/v1/admin/dashboard` (rôle `super-admin|validator`).
- `backend/tests/Feature/WebAuthRbacTest.php` -- Tests d'intégration automatisés pour la connexion Web et la vérification du contrôle d'accès Spatie RBAC 403.

## Tasks & Acceptance

**Execution:**
- [x] `backend/database/seeders/RolesAndPermissionsSeeder.php` -- Créer le Seeder Spatie -- Initialiser les 5 rôles et des comptes utilisateurs de démonstration (`admin@sapsap.bf`, `business@sapsap.bf`).
- [x] `backend/app/Http/Controllers/Api/Auth/WebAuthController.php` -- Créer `WebAuthController` -- Implémenter `login`, `logout` et la réponse JSON uniforme avec les rôles Spatie.
- [x] `backend/routes/api.php` -- Déclarer les routes Web Auth et RBAC -- Ajouter `/v1/auth/web/login`, `/v1/auth/web/logout` et la route protégée de test `/v1/admin/test-rbac`.
- [x] `backend/tests/Feature/WebAuthRbacTest.php` -- Créer les tests d'intégration -- Vérifier la connexion email/password, l'émission du token Sanctum et le rejet HTTP 403 Forbidden pour les rôles insuffisants.

**Acceptance Criteria:**
- **Given** des identifiants valides `admin@sapsap.bf` / `password`, **When** une requête POST est envoyée sur `/api/v1/auth/web/login`, **Then** l'API retourne HTTP 200 avec le token Sanctum et le tableau des rôles `['super-admin']`.
- **Given** un utilisateur authentifié avec le rôle `company-viewer`, **When** il tente d'accéder à la route `/api/v1/admin/test-rbac` exigeant le rôle `super-admin`, **Then** le serveur retourne HTTP 403 Forbidden.

## Design Notes

- Utilisation du middleware `Spatie\Permission\Middleware\RoleMiddleware` aliasé ou configuré dans `bootstrap/app.php` pour la protection déclarative des routes API.

## Verification

**Commands:**
- `docker compose exec backend php artisan db:seed --class=RolesAndPermissionsSeeder` -- expected: Seed SUCCESS
- `docker compose exec backend php artisan test --filter=WebAuthRbacTest` -- expected: Tests PASS
- `curl -X POST http://localhost:8080/api/v1/auth/web/login -H "Content-Type: application/json" -d '{"email": "admin@sapsap.bf", "password": "password"}'` -- expected: HTTP 200 OK avec token & role super-admin

## Suggested Review Order

**Logique d'Authentification Web & Rôles**

- Implémentation de login/logout Web et émission des tokens avec rôles Spatie
  [`WebAuthController.php:1`](../../backend/app/Http/Controllers/Api/Auth/WebAuthController.php#L1)

**Seeder des Rôles Spatie & Utilisateurs**

- Seeder créant les 5 rôles et les comptes de test (admin, validator, business, viewer)
  [`RolesAndPermissionsSeeder.php:1`](../../backend/database/seeders/RolesAndPermissionsSeeder.php#L1)

**Configuration du Bootstrap & Alias Middleware**

- Configuration des alias Spatie RBAC et gestion de l'exception 403 Forbidden
  [`app.php:14`](../../backend/bootstrap/app.php#L14)

**Routes API & Middleware RBAC**

- Déclaration des routes Web auth et de la route de test d'autorisation RBAC
  [`api.php:1`](../../backend/routes/api.php#L1)

**Suite de Tests Automatisés**

- Tests automatisés de la connexion Web, des erreurs 401/422 et du rejet RBAC 403
  [`WebAuthRbacTest.php:1`](../../backend/tests/Feature/WebAuthRbacTest.php#L1)

