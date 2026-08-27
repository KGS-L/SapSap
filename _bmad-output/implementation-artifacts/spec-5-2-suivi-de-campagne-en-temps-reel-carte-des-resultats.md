---
title: 'Story 5.2 : Suivi de Campagne en Temps Réel & Carte des Résultats'
type: 'feature'
created: '2026-08-27'
status: 'done'
baseline_commit: 'aba2cf8471d4e98f40b5290ed3f1072806d58455'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les entreprises clientes ont besoin de suivre en direct l'exécution de leurs campagnes d'audit et de vérification terrain à Ouagadougou, de visualiser géographiquement la couverture de leurs points de vente, et d'accéder instantanément à la synthèse des réponses et aux photographies des missions complétées.

**Approach:** Développer l'API de suivi et de cartographie des résultats sous Laravel (`CampaignBusinessController`), calculant en temps réel le taux de complétion, la consommation budgétaire et agrégeant les points géoréférencés avec leurs soumissions. Côté front-end (`web-business`), construire le portail d'entreprise Angular avec tableau de bord en direct, métriques KPI, carte interactive de Ouagadougou avec marqueurs d'état (validé, en attente, réservé, disponible) et volet d'inspection détaillée des preuves terrain (photos haute résolution, réponses au questionnaire, écart GPS).

## Boundaries & Constraints

**Always:**
- Restreindre l'accès aux données de campagne aux seuls utilisateurs autorisés de l'entreprise (`company-admin` / `company-viewer`) ou administrateurs.
- Calculer dynamiquement le pourcentage d'avancement réel `(missions validées / missions totales) * 100` et le budget consommé `missions validées * reward_per_mission`.
- Renvoyer pour chaque point cartographié ses coordonnées géographiques (`latitude`, `longitude`), son statut actuel, les réponses au formulaire et les URLs sécurisées des photos.
- Proposer une carte interactive centrée sur Ouagadougou avec vue double (carte interactive et liste détaillée) et filtres par statut et quartier.

**Ask First:**
- Modifier la formule de calcul de consommation budgétaire ou masquer les points non encore réalisés sur la carte.

**Never:**
- Ne jamais exposer les données d'une entreprise à une autre entreprise cliente (isolation stricte par compte/organisation).
- Ne jamais bloquer le rendu de la carte en cas d'absence de coordonnées GPS sur une mission (position par défaut ou exclusion propre).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Consultation suivi campagne active | Entreprise connectée accède à `GET /api/v1/business/campaigns/1/tracking` | Métriques en direct : % avancement (ex: 80%), budget consommé (ex: 40 000 FCFA), répartition par quartier et statut | 404 si campagne inexistante, 403 si non autorisé |
| Récupération des points pour la carte | `GET /api/v1/business/campaigns/1/results-map` | Liste des missions géolocalisées avec statuts, écart GPS, réponses et photos de la soumission associée | Format JSON standardisé avec tableau de points |
| Campagne sans missions réalisées | Nouvelle campagne en statut `active` avec 0 soumission | % avancement = 0%, budget consommé = 0 FCFA, carte affichant les points disponibles en attente | Affichage d'un état vide gracieux ("En attente des premiers contributeurs") |
| Inspection d'un point validé | Clic sur un marqueur vert sur la carte | Ouverture du volet d'inspection avec nom du lieu, écart GPS (ex: 22m), photos zoomables et réponses formulaire | Volet interactif fluide |

</frozen-after-approval>

## Code Map

- `backend/app/Models/Campaign.php` -- Relations avec missions et soumissions agrégées.
- `backend/app/Models/Mission.php` -- Relations `submissions()` et `latestSubmission()`.
- `backend/app/Http/Controllers/Api/V1/Business/CampaignBusinessController.php` -- Endpoints de tracking, KPIs et cartographie des résultats pour le portail Business.
- `backend/routes/api.php` -- Définition des routes `/api/v1/business/campaigns/*`.
- `backend/database/seeders/CampaignSeeder.php` & `SubmissionSeeder.php` -- Enrichissement du jeu de données pour une cartographie réaliste à Ouagadougou.
- `backend/tests/Feature/BusinessCampaignTrackingTest.php` -- Tests automatisés des métriques et de la carte des résultats.
- `web-business/src/styles.css` -- Design system moderne SapSap Business (thème pro, tokens émeraude, glassmorphism, responsive).
- `web-business/src/app/core/models/campaign.model.ts` -- Types TypeScript pour campagnes, KPIs de tracking et points de résultats.
- `web-business/src/app/core/services/campaign-business.service.ts` -- Service Angular réactif pour la gestion des campagnes et du suivi en temps réel.
- `web-business/src/app/core/services/auth.service.ts` -- Gestion de session et profils entreprise.
- `web-business/src/app/layout/business-layout/` -- Layout principal avec sidebar, navigation et profil connecté.
- `web-business/src/app/features/campaigns/campaigns-list/` -- Liste des campagnes entreprise avec badges d'avancement.
- `web-business/src/app/features/tracking/campaign-tracking/` -- Tableau de bord de suivi temps réel avec jauge de progression, filtres, carte interactive de Ouagadougou et volet d'inspection des preuves terrain.
- `web-business/src/app/app.routes.ts` & `app.config.ts` -- Configuration du routage et des providers Angular.

## Tasks & Acceptance

**Execution:**
- [x] `backend/app/Models/Mission.php` & `Campaign.php` -- Ajouter les relations Eloquent pour l'accès fluide aux soumissions -- Structurer l'agrégation de données.
- [x] `backend/app/Http/Controllers/Api/V1/Business/CampaignBusinessController.php` -- Implémenter les endpoints `index`, `show`, `tracking` et `resultsMap` -- Fournir les données métier agrégées.
- [x] `backend/routes/api.php` -- Déclarer les routes protégées `/api/v1/business/campaigns/*` -- Exposer l'API REST.
- [x] `backend/database/seeders/CampaignSeeder.php` & `SubmissionSeeder.php` -- Ajouter des missions géoréférencées complètes à Ouagadougou avec statuts variés -- Permettre la démonstration cartographique.
- [x] `backend/tests/Feature/BusinessCampaignTrackingTest.php` -- Écrire les tests d'intégration pour les KPIs et la cartographie -- Valider les règles métier.
- [x] `web-business/src/styles.css` -- Intégrer le design system complet SapSap -- Offrir une interface utilisateur moderne et soignée.
- [x] `web-business/src/app/core/` -- Définir les modèles, services et configuration d'authentification -- Structurer la couche de données front-end.
- [x] `web-business/src/app/layout/business-layout/` -- Créer la structure de navigation et header d'entreprise -- Assurer la cohérence ergonomique.
- [x] `web-business/src/app/features/campaigns/campaigns-list/` -- Développer la liste des campagnes avec jauges de complétion -- Faciliter l'accès aux projets.
- [x] `web-business/src/app/features/tracking/campaign-tracking/` -- Construire la vue temps réel avec KPIs, filtres, carte interactive de Ouagadougou et volet d'inspection de point -- Répondre à l'AC de la Story 5.2.

**Acceptance Criteria:**
- Given une entreprise connectée sur `business.sapsap.bf`, when elle accède à une campagne active, then la page affiche le pourcentage d'avancement en temps réel, le budget consommé vs alloué, et une carte interactive présentant l'ensemble des points avec la synthèse des réponses et des photos.
- Given un clic sur un point validé sur la carte, when l'utilisateur sélectionne le marqueur, then un volet latéral d'inspection affiche les photos prises sur le terrain, les réponses horodatées et l'écart GPS réel.
- Given une recherche ou sélection de filtre (par statut ou quartier), when appliquée, then la carte et la liste des points se mettent à jour instantanément.

## Verification

**Commands:**
- `npm run build` dans `web-business` -- expected: `Application bundle generation complete` (0 erreur).
- `php -l` sur tous les fichiers PHP créés/modifiés -- expected: 0 erreur de syntaxe.
- `php artisan test --filter=BusinessCampaignTrackingTest` (si PHP/artisan dispo) -- expected: Tests passants.

## Suggested Review Order

**API Backend & Modèles**

- Endpoints de suivi et cartographie des résultats avec calculs d'avancement et agrégation géographique.
  [`CampaignBusinessController.php:1`](../../backend/app/Http/Controllers/Api/V1/Business/CampaignBusinessController.php#L1)

- Déclaration des routes REST protégées pour le portail Business sous Sanctum.
  [`api.php:69`](../../backend/routes/api.php#L69)

- Relations Eloquent pour l'accès aux soumissions depuis les missions et campagnes.
  [`Mission.php:49`](../../backend/app/Models/Mission.php#L49)
  [`Campaign.php:52`](../../backend/app/Models/Campaign.php#L52)

**Portail Web Business Angular**

- Composant de suivi temps réel et carte interactive de Ouagadougou avec volet d'inspection.
  [`campaign-tracking.component.ts:1`](../../web-business/src/app/features/tracking/campaign-tracking/campaign-tracking.component.ts#L1)
  [`campaign-tracking.component.html:1`](../../web-business/src/app/features/tracking/campaign-tracking/campaign-tracking.component.html#L1)

- Liste des campagnes avec jauges de complétion et métriques budgétaires.
  [`campaigns-list.component.ts:1`](../../web-business/src/app/features/campaigns/campaigns-list/campaigns-list.component.ts#L1)
  [`campaigns-list.component.html:1`](../../web-business/src/app/features/campaigns/campaigns-list/campaigns-list.component.html#L1)

- Layout d'entreprise avec barre latérale et sélecteur de marque Sobbra / Orange.
  [`business-layout.component.ts:1`](../../web-business/src/app/layout/business-layout/business-layout.component.ts#L1)
  [`business-layout.component.html:1`](../../web-business/src/app/layout/business-layout/business-layout.component.html#L1)

- Service d'état réactif et données de démonstration réalistes à Ouagadougou.
  [`campaign-business.service.ts:1`](../../web-business/src/app/core/services/campaign-business.service.ts#L1)

**Tests & Données**

- Tests de validation des règles de calcul d'avancement, de budget et d'isolation d'entreprise.
  [`BusinessCampaignTrackingTest.php:1`](../../backend/tests/Feature/BusinessCampaignTrackingTest.php#L1)

- Données de test géoréférencées à Ouagadougou avec statuts variés et photos.
  [`CampaignSeeder.php:1`](../../backend/database/seeders/CampaignSeeder.php#L1)
  [`SubmissionSeeder.php:1`](../../backend/database/seeders/SubmissionSeeder.php#L1)

