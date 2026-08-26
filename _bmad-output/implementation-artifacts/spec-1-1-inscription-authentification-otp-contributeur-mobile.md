---
title: 'Story 1.1: Inscription & Authentification OTP Contributeur Mobile'
type: 'feature'
created: '2026-08-26'
status: 'done'
baseline_commit: '32fe4e96e3d798729d37dc8ecb79e3a2b676149e'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les contributeurs mobiles à Ouagadougou doivent pouvoir s'inscrire et s'authentifier facilement sur l'API SapSap via leur numéro de téléphone burkinabè et un code OTP SMS, sans mot de passe complexe.

**Approach:** Créer les endpoints API REST Laravel Sanctum `/api/v1/auth/mobile/request-otp` et `/api/v1/auth/mobile/verify-otp` pour générer/vérifier les codes OTP à 6 chiffres (avec code fixe de simulation `123456` en dev) et émettre un token Bearer Sanctum valide.

## Boundaries & Constraints

**Always:**
- Valider le format des numéros de téléphone burkinabè (`+226` suivi de 8 chiffres, ex: `+22670000000` ou `+226 70 00 00 00`).
- Retourner une enveloppe JSON uniforme : `{ "success": boolean, "data": object|array, "message": string, "errors": array|null }`.
- En environnement dev/test, accepter le code OTP `123456`.
- Assigner par défaut le rôle `contributor` aux utilisateurs mobiles enregistrés.

**Ask First:**
- Modification des dépendances système ou des clés d'API SMS externes d'agrégateur (ex: Orange SMS API en prod).

**Never:**
- Stocker les codes OTP en clair sans date d'expiration (expiration fixée à 10 minutes).
- Exposer les exceptions internes de la base de données dans la réponse API.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Requête OTP Valide | `{ "phone_number": "+22670000000" }` | `{ "success": true, "message": "Code OTP envoyé" }` | N/A |
| Numéro invalide | `{ "phone_number": "12345" }` | `{ "success": false, "message": "Format numéro invalide", "errors": [...] }` | HTTP 422 Unprocessable Entity |
| Validation OTP Succès | `{ "phone_number": "+22670000000", "otp_code": "123456" }` | `{ "success": true, "data": { "token": "...", "user": {...} } }` | N/A |
| OTP incorrect / expiré | `{ "phone_number": "+22670000000", "otp_code": "000000" }` | `{ "success": false, "message": "Code OTP invalide ou expiré" }` | HTTP 400 Bad Request |

</frozen-after-approval>

## Code Map

- `backend/database/migrations/0001_01_01_000000_create_users_table.php` -- Migration de la table `users` pour ajouter `phone_number` (unique), `otp_code`, `otp_expires_at`, `reputation_score`.
- `backend/app/Models/User.php` -- Modèle Eloquent étendu avec fillable `phone_number`, `otp_code`, `otp_expires_at`, `reputation_score` et méthode de génération token Sanctum.
- `backend/app/Http/Controllers/Api/Auth/MobileAuthController.php` -- Controller REST gérant la demande d'OTP et la vérification OTP avec émission du token Sanctum.
- `backend/routes/api.php` -- Enregistrement des routes API REST sous le préfixe `/v1/auth/mobile`.
- `backend/tests/Feature/MobileAuthTest.php` -- Tests automatisés PHPUnit/Pest pour la validation des numéros, l'envoi et la vérification OTP.

## Tasks & Acceptance

**Execution:**
- [x] `backend/database/migrations/0001_01_01_000000_create_users_table.php` -- Mettre à jour la structure de la table `users` -- Ajouter `phone_number`, `otp_code`, `otp_expires_at`, `reputation_score` (default 100).
- [x] `backend/app/Models/User.php` -- Mettre à jour le modèle `User` -- Configurer fillables et casts (datetime pour `otp_expires_at`).
- [x] `backend/app/Http/Controllers/Api/Auth/MobileAuthController.php` -- Créer le controller `MobileAuthController` -- Implémenter les méthodes `requestOtp` et `verifyOtp`.
- [x] `backend/routes/api.php` -- Ajouter les routes API v1 -- Déclarer `/v1/auth/mobile/request-otp` et `/v1/auth/mobile/verify-otp`.
- [x] `backend/tests/Feature/MobileAuthTest.php` -- Créer les tests d'intégration API -- Tester l'inscription OTP et l'émission du token Sanctum.

**Acceptance Criteria:**
- **Given** un numéro burkinabè `+226 70 00 00 00`, **When** une requête POST est envoyée sur `/api/v1/auth/mobile/request-otp`, **Then** le serveur enregistre le code OTP et retourne un statut HTTP 200 avec message de succès.
- **Given** une demande OTP existante, **When** le contributeur envoie POST `/api/v1/auth/mobile/verify-otp` avec le code `123456`, **Then** l'API retourne le token Sanctum `bearer` et les données de l'utilisateur avec HTTP 200.

## Design Notes

- Utilisation de la validation Laravel `FormRequest` ou `$request->validate()` avec expression régulière `/^(\+226|226)?[567][0-9]{7}$/` pour filtrer les numéros de téléphone du Burkina Faso.

## Verification

**Commands:**
- `docker compose exec backend php artisan test --filter=MobileAuthTest` -- expected: Tests PASS
- `curl -X POST http://localhost:8080/api/v1/auth/mobile/request-otp -H "Content-Type: application/json" -d '{"phone_number": "+22670000000"}'` -- expected: HTTP 200 OK

## Suggested Review Order

**Logique métier & Contrôleur d'Authentification**

- Implémentation des endpoints OTP request/verify et émission du token Sanctum
  [`MobileAuthController.php:1`](../../backend/app/Http/Controllers/Api/Auth/MobileAuthController.php#L1)

**Configuration des Routes API**

- Déclaration des routes V1 et protection par Sanctum
  [`api.php:1`](../../backend/routes/api.php#L1)

**Schéma & Modèle Utilisateur**

- Structure de la table users avec support mobile et score de réputation
  [`0001_01_01_000000_create_users_table.php:14`](../../backend/database/migrations/0001_01_01_000000_create_users_table.php#L14)

- Model User étendu avec Sanctum et Spatie RBAC
  [`User.php:10`](../../backend/app/Models/User.php#L10)

**Tests Automatisés**

- Suite de tests d'intégration PHPUnit pour l'authentification mobile OTP
  [`MobileAuthTest.php:1`](../../backend/tests/Feature/MobileAuthTest.php#L1)

