# Epic 1 Context: Infrastructure de Base & Authentification Multi-Rôles

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permettre à chaque type d'utilisateur (Contributeurs mobiles, Entreprises web, Administrateurs SapSap) de créer un compte sécurisé (OTP téléphone pour mobile, Email/Mot de passe pour Web), de s'authentifier via Laravel Sanctum et d'accéder à son profil et à ses autorisations RBAC Spatie (`super-admin`, `validator`, `company-admin`, `company-viewer`, `contributor`).

## Stories

- Story 1.1: Inscription & Authentification OTP Contributeur Mobile
- Story 1.2: Authentification Web Business & Admin avec Spatie RBAC
- Story 1.3: Gestion du Profil Contributeur & Score de Réputation

## Requirements & Constraints

- **FR1** : Inscription et authentification des contributeurs via numéro de téléphone burkinabè (`+226 XX XX XX XX`) et code OTP à 6 chiffres (code de test `123456` en environnement dev/simulation).
- **FR2** : Consultation et modification des informations du profil contributeur, avec suivi du score de réputation SapSap (ex: 92/100) et historique des prestations.
- **FR10 & NFR5** : Authentification des utilisateurs web Business (`business.sapsap.bf`) et Admin (`admin.sapsap.bf`) par email/mot de passe. Contrôle d'accès strict via Spatie RBAC (`super-admin`, `validator`, `company-admin`, `company-viewer`), retournant HTTP 403 Forbidden en cas d'accès non autorisé.
- Gestion de session par tokens API Laravel Sanctum (`Authorization: Bearer <token>`).
- Stockage sécurisé des identifiants et hashage des mots de passe en base de données PostgreSQL.

## Technical Decisions

- **Authentification REST** : Laravel Sanctum pour la génération et la validation des tokens d'API bearer.
- **Autorisations & Rôles** : Package `spatie/laravel-permission` pour la gestion fine des rôles et des autorisations d'accès aux routes de l'API REST backend.
- **Base de données** : PostgreSQL 16. Modèle `User` étendu pour intégrer le numéro de téléphone, le score de réputation (par défaut 100) et les données de profil.
- **Frontend Web** : Angular 18 (Standalone Components), `AuthService` avec signaux réactifs, `AuthGuard` et `RoleGuard` fonctionnels, `authInterceptor` injectant le token Bearer.
- **Simulateur OTP** : Service OTP backend générant un code à 6 chiffres et acceptant le code `123456` en mode local/simulation.

## UX & Interaction Patterns

- **Mobile** : Écran de saisie du numéro de téléphone burkinabè puis écran de validation du code OTP 6 chiffres.
- **Web Business & Admin** : Page de connexion `/login` avec formulaire réactif, validation en temps réel, retour d'erreur clair (HTTP 401) et redirection automatique selon le rôle.
