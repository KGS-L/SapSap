---
title: 'Story 1.2 : Authentification Web Business & Admin avec Spatie RBAC'
type: 'feature'
created: '2026-08-26'
status: 'done'
baseline_commit: '5aa1b14d497a2e359d3dcf1ae14bed3317eb95fd'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les utilisateurs d'administration (`admin.sapsap.bf`) et entreprises (`business.sapsap.bf`) ont besoin d'une authentification sécurisée par email/mot de passe et d'un cloisonnement strict de leurs accès selon leurs rôles RBAC (`super-admin`, `validator`, `company-admin`, `company-viewer`).

**Approach:** Développer les endpoints d'authentification Laravel Sanctum (`/api/v1/auth/login`, `/api/v1/auth/logout`, `/api/v1/auth/me`), associer les rôles Spatie au modèle `User`, et côté Angular (`web-admin`), créer la page `/login`, le service réactif `AuthService`, les guards `AuthGuard` / `RoleGuard` et l'intercepteur HTTP Bearer token.

## Boundaries & Constraints

**Always:**
- Utiliser Laravel Sanctum pour la délivrance et la validation des tokens d'API.
- Utiliser `spatie/laravel-permission` (`HasRoles`) sur le modèle `User` pour la gestion des rôles.
- Retourner une réponse HTTP 401 Unauthorized si les identifiants sont erronés et 403 Forbidden si le rôle n'a pas les privilèges requis.
- Côté Angular, stocker le token dans le stockage local sécurisé, injecter le header `Authorization: Bearer <token>` sur les requêtes API sortantes et rediriger vers `/login` sur expiration ou 401.

**Ask First:**
- Modifier la nomenclature des rôles standards (`super-admin`, `validator`, `company-admin`, `company-viewer`) ou la durée de validité des tokens.

**Never:**
- Ne jamais stocker de mots de passe en clair dans la base de données PostgreSQL.
- Ne jamais autoriser un contributeur mobile sans rôle d'administration à accéder aux endpoints protégés du portail admin.
- Ne jamais se fier uniquement au contrôle frontend : les permissions doivent être vérifiées côté serveur via middleware Laravel.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Connexion Admin réussie | Email `admin@sapsap.bf` + mot de passe valide | HTTP 200 `{ "success": true, "token": "...", "user": { "role": "super-admin" } }` -> Redirection `/dashboard` | N/A |
| Identifiants invalides | Email existant + mot de passe erroné | HTTP 401 `{ "success": false, "message": "Identifiants invalides" }` | Message d'alerte affiché sur le formulaire |
| Accès non authentifié | Navigation directe sur `/dashboard` sans token | Redirection immédiate vers `/login` via `AuthGuard` | Sauvegarde de l'URL cible pour redirection post-login |
| Déconnexion utilisateur | Clic sur "Se déconnecter" | Révocation du token Sanctum en base + purge du storage local -> Redirection `/login` | N/A |
| Accès rôle non autorisé | Utilisateur avec rôle `company-viewer` tentant une action admin | HTTP 403 Forbidden | Notification d'accès refusé |

</frozen-after-approval>

## Code Map

- `backend/app/Models/User.php` -- Intégration des traits `HasApiTokens` (Sanctum) et `HasRoles` (Spatie).
- `backend/app/Http/Controllers/Api/V1/AuthController.php` -- Contrôleur d'authentification API (`login`, `logout`, `me`).
- `backend/routes/api.php` -- Définition des routes d'authentification publiques et protégées (`auth:sanctum`).
- `backend/database/seeders/RoleAndUserSeeder.php` -- Seeder créant les rôles Spatie et les comptes de test initiaux.
- `web-admin/src/app/core/models/user.model.ts` -- Interfaces TypeScript `User`, `AuthResponse`, `LoginCredentials`.
- `web-admin/src/app/core/services/auth.service.ts` -- Service Angular gérant la session utilisateur avec Signals.
- `web-admin/src/app/core/guards/auth.guard.ts` -- Guard fonctionnel de vérification de session active.
- `web-admin/src/app/core/guards/role.guard.ts` -- Guard fonctionnel de contrôle des rôles autorisés.
- `web-admin/src/app/core/interceptors/auth.interceptor.ts` -- Intercepteur HTTP ajoutant le token Bearer.
- `web-admin/src/app/features/auth/login/login.component.ts` & `.html` & `.css` -- Page de connexion du portail admin.
- `web-admin/src/app/app.routes.ts` -- Intégration de la route `/login` et protection des routes du dashboard par `AuthGuard`.

## Tasks & Acceptance

**Execution:**
- [x] `backend/app/Models/User.php` -- Ajouter `Laravel\Sanctum\HasApiTokens` et `Spatie\Permission\Traits\HasRoles` -- Activer l'authentification token et les rôles.
- [x] `backend/app/Http/Controllers/Api/V1/AuthController.php` -- Créer les méthodes `login`, `logout` et `me` avec validation -- Gérer le cycle de vie de la session API.
- [x] `backend/routes/api.php` -- Déclarer les routes `/v1/auth/login`, `/v1/auth/logout`, `/v1/auth/me` -- Exposer l'API d'authentification.
- [x] `backend/database/seeders/RoleAndUserSeeder.php` -- Créer les 4 rôles Spatie et des comptes administrateur et validateur par défaut -- Permettre les tests d'authentification immédiats.
- [x] `web-admin/src/app/core/models/user.model.ts` -- Définir les types utilisateur et réponses API -- Assurer le typage strict des données de session.
- [x] `web-admin/src/app/core/services/auth.service.ts` -- Implémenter la connexion, déconnexion et état réactif `currentUser` -- Gérer l'état d'authentification côté client.
- [x] `web-admin/src/app/core/guards/auth.guard.ts` -- Créer `authGuard` et `roleGuard` -- Protéger les routes de l'administration.
- [x] `web-admin/src/app/core/interceptors/auth.interceptor.ts` -- Implémenter l'intercepteur Bearer token -- Transmettre le token Sanctum à chaque requête.
- [x] `web-admin/src/app/features/auth/login/login.component.ts` & `.html` & `.css` -- Construire l'interface de connexion -- Offrir une IHM de login élégante et réactive.
- [x] `web-admin/src/app/app.routes.ts` -- Configurer la route `/login` publique et appliquer `authGuard` sur le layout admin -- Verrouiller l'accès aux pages.

**Acceptance Criteria:**
- Given un administrateur sur `http://localhost:4201/login`, when il saisit `admin@sapsap.bf` et son mot de passe, then il reçoit un token Sanctum valide, son profil est stocké et il est redirigé vers `/dashboard`.
- Given un utilisateur non authentifié tentant d'accéder à `/dashboard` ou toute sous-route admin, when la navigation est initiée, then `authGuard` intercepte la requête et le redirige vers `/login`.
- Given un mot de passe incorrect lors de la soumission du formulaire, when l'API répond 401, then une alerte claire "Identifiants invalides" s'affiche sur le formulaire sans plantage.
- Given un administrateur connecté cliquant sur "Déconnexion", when l'action est validée, then le token est révoqué côté serveur et l'utilisateur est redirigé sur `/login`.

## Design Notes

L'intercepteur HTTP Angular 18 utilise la fonction `HttpInterceptorFn` moderne :
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

## Verification

**Commands:**
- `npm run build` dans `web-admin` -- expected: `Application bundle generation complete` (0 erreur)
- Exécution des migrations & seeders sur le backend Docker `docker compose exec backend php artisan migrate --seed` -- expected: rôles et utilisateurs créés sans erreur.

## Suggested Review Order

**Backend Authentication & RBAC Core**

- Intégration de Sanctum et Spatie sur le modèle User
  [`User.php:12`](../../backend/app/Models/User.php#L12)

- Contrôleur d'authentification API login, logout, me
  [`AuthController.php:17`](../../backend/app/Http/Controllers/Api/V1/AuthController.php#L17)

- Définition des routes publiques et protégées API v1
  [`api.php:13`](../../backend/routes/api.php#L13)

- Seeder créant les 4 rôles et les comptes de test
  [`RoleAndUserSeeder.php:15`](../../backend/database/seeders/RoleAndUserSeeder.php#L15)

**Frontend Web-Admin Authentication & Guards**

- Service réactif Angular Signals pour la gestion de session
  [`auth.service.ts:18`](../../web-admin/src/app/core/services/auth.service.ts#L18)

- Guard fonctionnel de protection des routes d'administration
  [`auth.guard.ts:5`](../../web-admin/src/app/core/guards/auth.guard.ts#L5)

- Intercepteur HTTP pour injection du token Bearer
  [`auth.interceptor.ts:6`](../../web-admin/src/app/core/interceptors/auth.interceptor.ts#L6)

- Composant de page de connexion et formulaire réactif
  [`login.component.ts:18`](../../web-admin/src/app/features/auth/login/login.component.ts#L18)

- Configuration du routage racine avec protection authGuard
  [`app.routes.ts:14`](../../web-admin/src/app/app.routes.ts#L14)
