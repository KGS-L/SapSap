# Epic 3 Context: Modération, Validation & Déploiement des Missions (Portail Admin)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permettre aux administrateurs et validateurs de modérer les campagnes en attente (`pending_approval`), d'approuver ou rejeter le cahier des charges/questionnaire, et de générer automatiquement des missions géolocalisées prêtes à être exécutées par les contributeurs.

## Stories

- Story 3.1: Dashboard de Validation de Campagne & Génération de Missions
- Story 3.2: Géofencing & Génération d'Emplacements Spatial (PostGIS)

## Requirements & Constraints

- **FR9** : Interface d'administration pour la modération et la validation des campagnes par les administrateurs SapSap.
- **AD-3** : Intégration PostGIS pour la géolocalisation spatiale des points d'enquêtes et le géofencing à 100m.
- **CAP-2** : Modération admin avec approbation/rejet explicite et génération automatique du lot de missions (`missions`).

## Technical Decisions

- **Modèle `Mission`** : Migration avec champs lat/lng (PostGIS compatible), statut (`available`, `assigned`, `submitted`, `validated`, `rejected`, `expired`) et rayon de géofencing (100 mètres).
- **Génération Géographique** : Générateur d'emplacements aléatoires autour du centre de Ouagadougou (`12.3714, -1.5197`) dans le quartier ciblé.
- **Flux d'Approbation** : `POST /api/v1/admin/campaigns/{id}/approve` et `POST /api/v1/admin/campaigns/{id}/reject`.
