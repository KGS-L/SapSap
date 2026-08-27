---
title: 'Consolidation du namespace unique API V1 (Backend Laravel)'
type: 'refactor'
created: '2026-08-27'
status: 'done'
baseline_commit: '488e1c6e23200c1a00dad1e827556f0364322b9f'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Actuellement, les contrôleurs backend sont dispersés entre deux espaces de noms distincts (`App\Http\Controllers\Api\*` pour les premières stories et `App\Http\Controllers\Api\V1\*` pour les stories récentes des Epics 4 et 5), créant de la redondance et de la confusion dans `routes/api.php`.

**Approach:** Déplacer et consolider tous les contrôleurs d'API sous le namespace unique et cohérent `App\Http\Controllers\Api\V1\*`, fusionner les méthodes complémentaires (`WalletController`, `AdminCampaignController`, etc.) sans régression fonctionnelle, et harmoniser les imports dans `backend/routes/api.php`.

## Boundaries & Constraints

**Always:** 
- Tous les contrôleurs API doivent résider sous `App\Http\Controllers\Api\V1` (ou sous-namespaces `Api\V1\Auth`, `Api\V1\Admin`, `Api\V1\Business`).
- Préserver 100% de la compatibilité des signatures d'endpoints HTTP, formats de réponse JSON et règles de validation existantes.
- Valider la syntaxe PHP (`php -l`) sur chaque fichier déplacé/modifié.

**Ask First:**
- Suppression définitive d'un endpoint ou modification de payload de requête/réponse.

**Never:**
- Casser les contrats d'API consommés par `web-admin`, `web-business` ou l'application `mobile-contributor`.
- Laisser des fichiers contrôleurs obsolètes résiduels orphelins dans `App\Http\Controllers\Api` (hors `V1`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Requête Auth Mobile OTP | POST `/api/v1/auth/mobile/request-otp` | Réponse JSON 200 via `Api\V1\Auth\MobileAuthController` | 422 si format numéro invalide |
| Requête Login Web | POST `/api/v1/auth/web/login` ou `/login` | Réponse JSON 200 avec Token Sanctum via `Api\V1\Auth\WebAuthController` / `AuthController` | 401 si identifiants incorrects |
| Consultation Profil | GET `/api/v1/profile` | Réponse JSON 200 via `Api\V1\ProfileController` | 401 si non authentifié |
| Portefeuille & Solde | GET `/api/v1/wallet/balance` & `/api/v1/wallet` | Réponse JSON 200 via `Api\V1\WalletController` | 401 si non authentifié |
| Retrait Portefeuille | POST `/api/v1/wallet/withdraw` | Réponse JSON 200 ou 422 selon le solde via `Api\V1\WalletController` | 422 si montant > solde ou < seuil |
| Découverte Missions | GET `/api/v1/missions` | Réponse JSON 200 via `Api\V1\MobileMissionController` | 401 si non authentifié |
| Modération Campagnes | POST `/api/v1/admin/campaigns/{id}/approve` | Génération missions & statut actif via `Api\V1\Admin\AdminCampaignController` / `CampaignAdminController` | 422 si non payée |
| Revue Soumissions | POST `/api/v1/admin/submissions/{id}/approve` | Validation, crédit escrow & réputation via `Api\V1\Admin\AdminSubmissionController` / `SubmissionAdminController` | 422 si déjà traitée |

</frozen-after-approval>

## Code Map

- `backend/app/Http/Controllers/Api/V1/Auth/MobileAuthController.php` -- Contrôleur OTP mobile déplacé sous `Api\V1\Auth`
- `backend/app/Http/Controllers/Api/V1/Auth/WebAuthController.php` -- Contrôleur Web Auth déplacé sous `Api\V1\Auth`
- `backend/app/Http/Controllers/Api/V1/ProfileController.php` -- Contrôleur profil utilisateur déplacé sous `Api\V1`
- `backend/app/Http/Controllers/Api/V1/MobileMissionController.php` -- Contrôleur missions & géolocalisation mobile déplacé sous `Api\V1`
- `backend/app/Http/Controllers/Api/V1/WalletController.php` -- Contrôleur unifié de gestion du portefeuille et des retraits
- `backend/app/Http/Controllers/Api/V1/Business/CampaignController.php` -- Contrôleur CRUD campagnes déplacé sous `Api\V1\Business`
- `backend/app/Http/Controllers/Api/V1/Business/CampaignPaymentController.php` -- Contrôleur séquestre & paiement déplacé sous `Api\V1\Business`
- `backend/app/Http/Controllers/Api/V1/Business/CampaignReportController.php` -- Contrôleur rapports & export déplacé sous `Api\V1\Business`
- `backend/app/Http/Controllers/Api/V1/Admin/AdminCampaignController.php` -- Contrôleur modération et génération de missions sous `Api\V1\Admin`
- `backend/app/Http/Controllers/Api/V1/Admin/AdminSubmissionController.php` -- Contrôleur revue manuelle des soumissions sous `Api\V1\Admin`
- `backend/routes/api.php` -- Fichier de routes API unifié important exclusivement `App\Http\Controllers\Api\V1\*`

## Tasks & Acceptance

**Execution:**
- [x] `backend/app/Http/Controllers/Api/V1/Auth/MobileAuthController.php` -- Déplacer depuis `Api/Auth/` et mettre à jour le namespace vers `App\Http\Controllers\Api\V1\Auth` -- Assurer la cohérence d'arborescence V1
- [x] `backend/app/Http/Controllers/Api/V1/Auth/WebAuthController.php` -- Déplacer depuis `Api/Auth/` et mettre à jour le namespace vers `App\Http\Controllers\Api\V1\Auth` -- Unifier l'authentification web
- [x] `backend/app/Http/Controllers/Api/V1/ProfileController.php` -- Déplacer depuis `Api/` et mettre à jour le namespace vers `App\Http\Controllers\Api\V1` -- Consolider la gestion de profil
- [x] `backend/app/Http/Controllers/Api/V1/MobileMissionController.php` -- Déplacer depuis `Api/` et mettre à jour le namespace vers `App\Http\Controllers\Api\V1` -- Consolider les opérations missions mobiles
- [x] `backend/app/Http/Controllers/Api/V1/WalletController.php` -- Fusionner les méthodes de consultation de solde (`getBalance`), synthèse (`show`), transactions (`transactions`) et retraits (`withdraw`) avec support des deux formats de validation -- Éliminer la duplication de `WalletController`
- [x] `backend/app/Http/Controllers/Api/V1/Business/CampaignController.php` -- Déplacer depuis `Api/Business/` et mettre à jour le namespace vers `App\Http\Controllers\Api\V1\Business` -- Consolider les endpoints de campagne
- [x] `backend/app/Http/Controllers/Api/V1/Business/CampaignPaymentController.php` -- Déplacer depuis `Api/Business/` et mettre à jour le namespace vers `App\Http\Controllers\Api\V1\Business` -- Consolider le paiement séquestre
- [x] `backend/app/Http/Controllers/Api/V1/Business/CampaignReportController.php` -- Déplacer depuis `Api/Business/` et mettre à jour le namespace vers `App\Http\Controllers\Api\V1\Business` -- Consolider le reporting business
- [x] `backend/app/Http/Controllers/Api/V1/Admin/AdminCampaignController.php` -- Déplacer depuis `Api/Admin/` et mettre à jour le namespace vers `App\Http\Controllers\Api\V1\Admin` -- Consolider la modération admin avec génération de missions
- [x] `backend/app/Http/Controllers/Api/V1/Admin/AdminSubmissionController.php` -- Déplacer depuis `Api/Admin/` et mettre à jour le namespace vers `App\Http\Controllers\Api\V1\Admin` -- Consolider la revue manuelle avec attribution de réputation
- [x] `backend/routes/api.php` -- Mettre à jour l'ensemble des imports de contrôleurs pour pointer exclusivement vers `App\Http\Controllers\Api\V1\*` et nettoyer les références legacy -- Clôturer l'Action Item 1
- [x] `backend/app/Http/Controllers/Api/*` -- Nettoyer et supprimer les anciens répertoires et fichiers contrôleurs obsolètes hors `V1` -- Supprimer la dette technique

**Acceptance Criteria:**
- Given une installation backend Laravel, when on analyse l'arborescence `backend/app/Http/Controllers/Api`, then aucun contrôleur ne subsiste en dehors du sous-dossier `V1/`.
- Given le fichier de routes `backend/routes/api.php`, when on inspecte les déclarations `use`, then 100% des contrôleurs importés proviennent de `App\Http\Controllers\Api\V1`.
- Given l'ensemble des fichiers PHP du projet, when on exécute un linter/vérificateur de syntaxe (`php -l`), then 0 erreur n'est détectée.

## Spec Change Log

## Design Notes

Pour le contrôleur `WalletController`, la version unifiée dans `Api\V1\WalletController.php` fournira :
1. `getBalance(Request $request)` : calcul dynamique du solde pour l'application mobile.
2. `show(Request $request)` : vue d'ensemble du portefeuille via `WalletService` pour le portail web.
3. `withdraw(Request $request)` : supporte à la fois les paramètres du mobile (`payment_method`, minimum 500/1000 FCFA) et les paramètres web (`provider`).
4. `transactions(Request $request)` : pagination des transactions.

## Verification

**Commands:**
- `Get-ChildItem -Path "backend\app\Http\Controllers\Api\V1" -Recurse` -- expected: Tous les contrôleurs API sont listés sous V1
- `Get-ChildItem -Path "backend\app\Http\Controllers\Api" -File` -- expected: Aucun contrôleur orphelin à la racine de Api/
- `Get-ChildItem -Path "backend\app\Http\Controllers\Api\V1" -Filter "*.php" -Recurse | ForEach-Object { php -l $_.FullName }` -- expected: No syntax errors detected in all files

## Suggested Review Order

**Point d'entrée du routage**

- Fichier de routes centralisé important uniquement les contrôleurs `Api\V1\*`
  [`api.php:3`](../../backend/routes/api.php#L3)

**Contrôleurs Authentification & Utilisateur**

- Contrôleur OTP mobile pour contributeurs
  [`MobileAuthController.php:3`](../../backend/app/Http/Controllers/Api/V1/Auth/MobileAuthController.php#L3)

- Contrôleur de connexion web et administration
  [`WebAuthController.php:3`](../../backend/app/Http/Controllers/Api/V1/Auth/WebAuthController.php#L3)

- Contrôleur de profil utilisateur et réputation
  [`ProfileController.php:3`](../../backend/app/Http/Controllers/Api/V1/ProfileController.php#L3)

**Contrôleurs Métier Missions & Portefeuille**

- Contrôleur de gestion du portefeuille fusionné (flux mobile et web)
  [`WalletController.php:3`](../../backend/app/Http/Controllers/Api/V1/WalletController.php#L3)

- Contrôleur de découverte géolocalisée et soumission mobile
  [`MobileMissionController.php:3`](../../backend/app/Http/Controllers/Api/V1/MobileMissionController.php#L3)

**Contrôleurs Entreprise & Administration**

- Contrôleur CRUD des campagnes d'entreprises
  [`CampaignController.php:3`](../../backend/app/Http/Controllers/Api/V1/Business/CampaignController.php#L3)

- Contrôleur de modération admin et génération automatique de missions
  [`AdminCampaignController.php:3`](../../backend/app/Http/Controllers/Api/V1/Admin/AdminCampaignController.php#L3)

- Contrôleur de revue manuelle et validation des soumissions
  [`AdminSubmissionController.php:3`](../../backend/app/Http/Controllers/Api/V1/Admin/AdminSubmissionController.php#L3)

