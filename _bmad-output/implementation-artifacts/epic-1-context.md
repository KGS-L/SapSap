# Epic 1 Context: Infrastructure de Base & Authentification Multi-Rôles

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permettre à chaque type d'utilisateur (Contributeurs mobiles, Entreprises web, Administrateurs SapSap) de créer un compte sécurisé (OTP téléphone pour mobile, Email/Mot de passe pour Web), de s'authentifier via Laravel Sanctum et d'accéder à son profil et à ses autorisations RBAC Spatie (`super-admin`, `validator`, `company-admin`, `company-viewer`).

## Stories

- Story 1.1: Inscription & Authentification OTP Contributeur Mobile
- Story 1.2: Authentification Web Business & Admin avec Spatie RBAC
- Story 1.3: Gestion du Profil Contributeur & Score de Réputation

## Requirements & Constraints

- Numéro de téléphone burkinabè (`+226 XX XX XX XX`) avec vérification OTP SMS à 6 chiffres pour les contributeurs mobiles (code test `123456` en dev/simulation).
- Authentification par Email et Mot de passe pour les portails web (`admin.sapsap.bf` et `business.sapsap.bf`).
- Gestion de session par tokens API Laravel Sanctum (`Authorization: Bearer <token>`).
- Contrôle d'accès basé sur les rôles (RBAC) via `spatie/laravel-permission` avec codes de statut HTTP 403 Forbidden en cas d'accès non autorisé.
- Stockage sécurisé des identifiants et hashage des mots de passe en base de données PostgreSQL.

## Technical Decisions

- **Backend** : Module `Auth` sous Laravel 11, Sanctum 4.x, Spatie Permissions 6.x.
- **Frontend Web** : Angular 18 (Standalone Components), `AuthService` avec signaux réactifs, `AuthGuard` et `RoleGuard` fonctionnels, `authInterceptor` injectant le token Bearer.
- **Modèle de données** : Table `users` (id UUID v4, name, email, phone, reputation_score, created_at), tables Spatie `roles`, `permissions`, `model_has_roles`.
- **Réponses API standard** : Enveloppe uniforme `{ "success": boolean, "data": object|array, "message": string, "errors": array|null }`.

## UX & Interaction Patterns

- Page de connexion dédiée `/login` avec redirection automatique selon le rôle après authentification réussie.
- Formulaire d'authentification avec validation en temps réel, indicateurs d'erreur clairs et état de chargement (spinner) lors de la soumission.

## Cross-Story Dependencies

- Story 1.2 fournit les fondations d'authentification et de contrôle d'accès pour toutes les fonctionnalités d'administration (Épic 4) et de gestion d'entreprise (Épic 2 & Épic 5).
