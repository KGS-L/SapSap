---
title: 'Story 5.3 : Exportation des Données de Campagne (CSV / Excel)'
type: 'feature'
created: '2026-08-27'
status: 'done'
baseline_commit: '75f27f14c241d2f841b042cf001e2ee8b64ede6e'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les entreprises clientes ont besoin d'exploiter les résultats des missions terrain (audits PLV, vérifications de points de vente, relevés de prix à Ouagadougou) en dehors de la plateforme SapSap, en les intégrant directement dans leurs outils décisionnels et ERP internes (Excel, PowerBI, CRM).

**Approach:** Développer les endpoints d'exportation Laravel (`CampaignBusinessController`) pour générer à la demande des fichiers structurés CSV (avec BOM UTF-8 pour Excel) et Excel (.xls / XML Spreadsheet) enrichis de toutes les métadonnées de mission (coordonnées GPS, réponses, photos horodatées, écarts de distance). Côté front-end (`web-business`), intégrer des déclencheurs et modales d'exportation intuitives dans le tableau de bord de suivi temps réel et sur la liste des campagnes avec options de filtrage (missions validées ou complètes).

## Boundaries & Constraints

**Always:**
- Restreindre l'accès à l'exportation aux seuls utilisateurs autorisés de l'entreprise propriétaire de la campagne (`company-admin` / `company-viewer`) ou administrateurs SapSap.
- Inclure dans le fichier d'export l'identifiant de la mission, le lieu/quartier, la ville, la date/heure de soumission, le statut, les coordonnées GPS constatées et cibles, l'écart GPS en mètres, le nom du contributeur, le score réputation, les réponses complètes au questionnaire et les URLs des photos.
- Générer un encodage UTF-8 propre avec BOM (`\xEF\xBB\xBF`) pour le format CSV afin d'assurer l'affichage impeccable des caractères accentués sous Microsoft Excel.
- Fournir un nom de fichier horodaté et explicite, par exemple : `sapsap-campagne-{id}-export-{date}.csv` et `.xls`.

**Ask First:**
- Modifier la structure des colonnes standards de l'export ou exclure les missions en statut autre que `validated`.

**Never:**
- Ne jamais permettre à une entreprise de télécharger les données d'une campagne concurrente (isolation stricte par compte/organisation).
- Ne jamais bloquer la génération de l'export si une mission ne possède pas de photo ou de soumission (valeurs vides gracieuses gérées).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Exportation CSV d'une campagne active | Entreprise connectée appelle `GET /api/v1/business/campaigns/1/export/csv` | Flux binaire CSV UTF-8 (délimiteur `;` ou `,`) avec en-têtes complets et lignes de missions | 404 si campagne inexistante, 403 si non autorisée |
| Exportation Excel d'une campagne | Entreprise connectée appelle `GET /api/v1/business/campaigns/1/export/excel` | Fichier Excel (.xls XML / Spreadsheet) structuré avec mise en forme | 404 si campagne inexistante, 403 si non autorisée |
| Filtrage par statut dans l'export | `GET /api/v1/business/campaigns/1/export/csv?status=validated` | Export contenant uniquement les missions dont le statut est validé | Si aucune mission ne correspond, fichier avec en-têtes et 0 ligne de données |
| Campagne sans soumission terminée | Campagne venant d'être créée (0 mission validée) | Fichier généré avec la liste des points prévus et colonnes de soumission vides | Fichier valide téléchargé |
| Téléchargement côté portail web | Clic sur "Exporter CSV" ou "Exporter Excel" sur `business.sapsap.bf` | Déclenchement instantané du téléchargement du fichier dans le navigateur et notification toast | Message d'erreur utilisateur si échec réseau avec fallback client |

</frozen-after-approval>

## Code Map

- `backend/app/Http/Controllers/Api/V1/Business/CampaignBusinessController.php` -- Ajout des méthodes d'exportation `exportCsv` et `exportExcel` avec formatage des colonnes, gestion du BOM UTF-8 et sérialisation des réponses et photos.
- `backend/routes/api.php` -- Déclaration des routes `GET /api/v1/business/campaigns/{id}/export/csv` et `GET /api/v1/business/campaigns/{id}/export/excel`.
- `backend/tests/Feature/BusinessCampaignExportTest.php` -- Tests automatisés de validation du contenu CSV, Excel, filtres de statut et vérification d'isolation multi-tenant.
- `web-business/src/app/core/services/campaign-business.service.ts` -- Méthodes `exportCampaignData` (téléchargement Blob) et fallback de génération côté client `downloadMockExport`.
- `web-business/src/app/features/tracking/campaign-tracking/campaign-tracking.component.ts` & `.html` -- Boutons d'exportation CSV/Excel, modale de configuration d'export avec filtres de statut et notification toast.
- `web-business/src/app/features/campaigns/campaigns-list/campaigns-list.component.ts` & `.html` -- Action d'exportation rapide sur chaque carte de campagne.
- `web-business/src/styles.css` -- Styles pour la modale d'exportation, les boutons de téléchargement et les toasts de confirmation.

## Tasks & Acceptance

**Execution:**
- [x] `backend/app/Http/Controllers/Api/V1/Business/CampaignBusinessController.php` -- Implémenter les méthodes `exportCsv` et `exportExcel` avec extraction complète des missions, soumissions, réponses et photos -- Assurer la génération des fichiers structurés.
- [x] `backend/routes/api.php` -- Déclarer les routes protégées d'exportation pour le portail Business -- Exposer l'API d'export.
- [x] `backend/tests/Feature/BusinessCampaignExportTest.php` -- Créer la suite de tests de fonctionnalités pour les exports CSV et Excel -- Garantir la conformité et la sécurité.
- [x] `web-business/src/app/core/services/campaign-business.service.ts` -- Ajouter les fonctions de téléchargement Blob et de génération client pour la démo -- Connecter l'UI à l'API d'export.
- [x] `web-business/src/app/features/tracking/campaign-tracking/` -- Intégrer les boutons d'exportation dans le suivi de campagne avec modale d'options (format CSV/Excel, filtre statut) -- Répondre à l'AC de la Story 5.3.
- [x] `web-business/src/app/features/campaigns/campaigns-list/` -- Ajouter le bouton d'export rapide sur la liste des campagnes -- Faciliter l'accès aux exports.
- [x] `web-business/src/styles.css` -- Ajouter les styles de modale d'export et boutons d'action -- Assurer l'excellence visuelle du portail.

**Acceptance Criteria:**
- Given une campagne avec des missions complétées ou en cours, when l'utilisateur entreprise clique sur "Exporter CSV" ou "Exporter Excel", then le serveur génère et télécharge un fichier structuré contenant pour chaque mission : identifiant, titre, lieu/quartier, ville, date/heure, coordonnées GPS cibles et constatées, écart GPS, réponses au questionnaire et liens vers les photographies.
- Given une demande d'export avec filtre de statut (ex: `validated`), when le fichier est généré, then seules les missions correspondant au filtre sont incluses.
- Given un utilisateur d'une entreprise tierce, when il tente d'exporter les données d'une campagne qui ne lui appartient pas, then le serveur retourne une réponse 403 Forbidden.

## Design Notes

- **CSV UTF-8 BOM** : Inclusion de `\xEF\xBB\xBF` en début de flux et délimiteur `;` pour une ouverture native parfaite dans Excel (FR/Windows) sans altération des accents.
- **Excel SpreadsheetML (.xls)** : Structure XML standard interprétée nativement par Microsoft Excel avec en-têtes stylisés en vert émeraude SapSap (#059669), bordures nettes et types de données typés (nombres, devises FCFA, liens cliquables).
- **Formatage des réponses dynamiques** : Transformation des tableaux de questions/réponses JSON en chaînes lisibles et délimitées ou colonnes individuelles.

## Verification

**Commands:**
- `npm run build` dans `web-business` -- expected: `Application bundle generation complete` (0 erreur).
- `php -l` sur les fichiers PHP modifiés -- expected: 0 erreur de syntaxe.
- `php artisan test --filter=BusinessCampaignExportTest` (si PHP/artisan dispo) -- expected: Tests passants.

**Manual checks (if no CLI):**
- Cliquer sur le bouton "Exporter les données" sur le portail Business, vérifier le téléchargement effectif du fichier `.csv` ou `.xls` et son contenu dans un tableur.

## Suggested Review Order

**API Backend & Génération des Fichiers**

- Méthodes d'exportation CSV avec BOM UTF-8 et Excel XML SpreadsheetML.
  [`CampaignBusinessController.php:336`](../../backend/app/Http/Controllers/Api/V1/Business/CampaignBusinessController.php#L336)

- Déclaration des routes d'exportation protégées pour le portail entreprise.
  [`api.php:76`](../../backend/routes/api.php#L76)

**Portail Web Business Angular**

- Modale d'exportation et boutons de téléchargement direct dans le suivi temps réel.
  [`campaign-tracking.component.html:31`](../../web-business/src/app/features/tracking/campaign-tracking/campaign-tracking.component.html#L31)
  [`campaign-tracking.component.ts:182`](../../web-business/src/app/features/tracking/campaign-tracking/campaign-tracking.component.ts#L182)

- Boutons d'export rapide CSV et Excel sur les cartes de campagnes.
  [`campaigns-list.component.html:141`](../../web-business/src/app/features/campaigns/campaigns-list/campaigns-list.component.html#L141)
  [`campaigns-list.component.ts:37`](../../web-business/src/app/features/campaigns/campaigns-list/campaigns-list.component.ts#L37)

- Service de téléchargement Blob et générateur d'export client avec BOM.
  [`campaign-business.service.ts:91`](../../web-business/src/app/core/services/campaign-business.service.ts#L91)

- Styles graphiques de la modale d'exportation et des notifications toast.
  [`styles.css:309`](../../web-business/src/styles.css#L309)

**Tests & Conformité**

- Suite de tests unitaires et d'intégration validant les formats CSV, Excel et la sécurité multi-tenant.
  [`BusinessCampaignExportTest.php:1`](../../backend/tests/Feature/BusinessCampaignExportTest.php#L1)

