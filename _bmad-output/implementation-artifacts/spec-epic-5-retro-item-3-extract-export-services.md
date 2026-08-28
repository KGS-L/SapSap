---
title: "Extraction des flux d'exportation CSV et Excel de CampaignBusinessController vers CampaignExportService"
type: 'refactor'
created: '2026-08-27'
status: 'draft'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `CampaignBusinessController` concentrait plus de 600 lignes en cumulant la gestion HTTP/KPIs et la génération bas niveau des flux binaires CSV (BOM UTF-8) et XML SpreadsheetML (Excel).

**Approach:** Extraire toute la logique de structuration des données et de génération des flux d'exportation dans un service dédié `App\Services\Export\CampaignExportService`, et alléger `CampaignBusinessController` en lui injectant ce service pour déléguer les exports.

## Boundaries & Constraints

**Always:**
- Maintenir la stricte compatibilité des réponses HTTP d'exportation (headers Content-Type, Content-Disposition, nom de fichier `sapsap-campagne-{id}-export-{timestamp}.{ext}`, BOM UTF-8 pour CSV, XML SpreadsheetML stylisé pour Excel).
- Conserver les mêmes règles de filtrage (statut de mission `status`, quartier `neighborhood`).
- Conserver la vérification des droits d'accès (propriétaire de la campagne, super-admin, validator) dans le contrôleur avant appel au service d'export.
- Valider la syntaxe PHP (`php -l`) sur tous les fichiers créés et modifiés.

**Ask First:**
- Modification des colonnes exportées ou de la structure du fichier XML/CSV.

**Never:**
- Laisser la logique de formatage de lignes de données et de streaming binaire dans `CampaignBusinessController`.
- Casser les contrats d'API existants consommés par le portail `web-business`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Export CSV Standard | `GET /api/v1/business/campaigns/1/export/csv` | StreamedResponse text/csv avec BOM UTF-8 `\xEF\xBB\xBF` et séparateur `;` | 404 si campagne inexistante, 403 si non autorisé |
| Export CSV Filtré | `GET /api/v1/business/campaigns/1/export/csv?status=validated&neighborhood=Patte` | StreamedResponse avec uniquement les missions validées du quartier spécifié | 200 avec fichier vide de données si aucun match |
| Export Excel SpreadsheetML | `GET /api/v1/business/campaigns/1/export/excel` | Response application/vnd.ms-excel avec balises XML Workbook, Styles et Worksheet | 404 si campagne inexistante, 403 si non autorisé |

</frozen-after-approval>

## Code Map

- `backend/app/Services/Export/CampaignExportService.php` -- Nouveau service dédié à l'extraction, préparation des lignes et génération des flux CSV & Excel
- `backend/app/Http/Controllers/Api/V1/Business/CampaignBusinessController.php` -- Contrôleur allégé injectant `CampaignExportService` pour les endpoints `exportCsv` et `exportExcel`
- `_bmad-output/implementation-artifacts/epic-5-retro-2026-08-27.md` -- Document de rétrospective Epic 5 avec statut d'action item
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- Suivi d'état du sprint

## Tasks & Acceptance

**Execution:**
- [ ] `backend/app/Services/Export/CampaignExportService.php` -- Créer le service avec les méthodes `prepareRows`, `getHeaders`, `exportCsv` et `exportExcel` -- Encapsulation du domaine d'export
- [ ] `backend/app/Http/Controllers/Api/V1/Business/CampaignBusinessController.php` -- Injecter `CampaignExportService`, supprimer `prepareExportRows` et déléguer les exports au service -- Découplage et allégement du contrôleur
- [ ] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- Marquer `epic-5-retro-item-3-extraire-les-flux-d-exportation-csv-et-e` comme `done` -- Synchronisation de sprint
- [ ] `_bmad-output/implementation-artifacts/epic-5-retro-2026-08-27.md` -- Mettre à jour le tableau des Action Items avec le statut `done` -- Clôture du point de rétro

**Acceptance Criteria:**
- Given `CampaignExportService`, when on appelle `exportCsv` ou `exportExcel`, then le flux retourné contient l'intégralité des données de missions/soumissions structurées selon le format attendu.
- Given `CampaignBusinessController`, when on inspecte son code source, then les méthodes `exportCsv` et `exportExcel` délèguent immédiatement au `CampaignExportService` et la méthode privée `prepareExportRows` n'est plus présente dans le contrôleur.
- Given l'ensemble des fichiers modifiés, when on lance `php -l`, then aucune erreur de syntaxe n'est retournée.

## Spec Change Log

## Design Notes

Le service `CampaignExportService` encapsule :
1. `prepareRows(Campaign $campaign, ?string $statusFilter = null, ?string $neighborhoodFilter = null): array` : transformation des relations Eloquent (missions, submissions, assignedUser, photos, answers, écart GPS, mode de validation).
2. `getHeaders(): array` : définition unique des en-têtes de colonnes.
3. `exportCsv(Campaign $campaign, ?string $statusFilter = null, ?string $neighborhoodFilter = null): StreamedResponse` : configuration des headers HTTP, injection du BOM UTF-8 et streaming via callback `fputcsv`.
4. `exportExcel(Campaign $campaign, ?string $statusFilter = null, ?string $neighborhoodFilter = null): Response` : génération du XML SpreadsheetML avec palette de style SapSap (vert émeraude `#059669`).

## Verification

**Commands:**
- `php -l backend/app/Services/Export/CampaignExportService.php` -- expected: No syntax errors detected
- `php -l backend/app/Http/Controllers/Api/V1/Business/CampaignBusinessController.php` -- expected: No syntax errors detected
