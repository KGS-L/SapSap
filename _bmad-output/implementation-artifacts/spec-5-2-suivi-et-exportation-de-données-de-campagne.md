---
title: 'Story 5.2 & 5.3: Suivi de Campagne en Temps Réel, Carte & Exportation CSV/JSON'
type: 'feature'
created: '2026-08-26'
status: 'done'
baseline_commit: 'd41d4511d94b05537ef6fc9529367e9b049d5059'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les entreprises et administrateurs doivent pouvoir suivre la progression en temps réel des campagnes d'investigation sur une carte et exporter l'intégralité des données collectées (réponses, photos, coordonnées GPS) sous format JSON ou CSV.

**Approach:** Implémenter le contrôleur `CampaignReportController` (`getReport`, `exportData`), enregistrer les routes `/v1/business/campaigns/{id}/report` et `/v1/business/campaigns/{id}/export`, et ajouter la suite de tests `CampaignReportExportTest.php`.

## Boundaries & Constraints

**Always:**
- Restreindre l'accès à l'entreprise propriétaire de la campagne (`company_id = user.id`) ou aux administrateurs/validateurs (`super-admin`, `validator`).
- Calculer dynamiquement le taux d'avancement (pourcentage de missions au statut `validated`).
- Générer un CSV RFC-4180 valide avec encodage UTF-8 et en-têtes explicites.
- Protéger l'isolation multi-entreprises (une entreprise ne peut pas voir le rapport d'une autre entreprise).

**Ask First:**
- Ajouter des formats d'exportation supplémentaires (ex: XLSX Excel natif).

**Never:**
- Exposer les données de campagnes d'une autre entreprise.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Rapport & Métriques | GET `/api/v1/business/campaigns/{id}/report` | `{ "success": true, "data": { "completion_rate_percentage": 100, "validated_missions_count": 5, "missions": [...] } }` | HTTP 200 OK |
| Export JSON | GET `/api/v1/business/campaigns/{id}/export?format=json` | Dump JSON téléchargeable structuré avec métriques et soumissions | HTTP 200 OK |
| Export CSV | GET `/api/v1/business/campaigns/{id}/export?format=csv` | Fichier `text/csv` téléchargeable avec colonnes de résultats | HTTP 200 OK |
| tentative Accès Autre Entreprise | GET `/api/v1/business/campaigns/{other_id}/report` | `{ "success": false, "message": "Accès non autorisé à cette campagne." }` | HTTP 403 Forbidden |

</frozen-after-approval>

## Code Map

- `backend/app/Http/Controllers/Api/Business/CampaignReportController.php` -- Controller REST pour la synthèse de campagne et les exports CSV/JSON (`getReport`, `exportData`).
- `backend/routes/api.php` -- Routes `/v1/business/campaigns/{id}/report` et `/v1/business/campaigns/{id}/export`.
- `backend/tests/Feature/CampaignReportExportTest.php` -- Suite de tests automatisés PHPUnit pour les métriques et l'exportation des données.

## Tasks & Acceptance

**Execution:**
- [x] `backend/app/Http/Controllers/Api/Business/CampaignReportController.php` -- Implémenter `getReport` et `exportData`.
- [x] `backend/routes/api.php` -- Déclarer les routes de rapport et d'export.
- [x] `backend/tests/Feature/CampaignReportExportTest.php` -- Créer la suite de tests d'intégration PHPUnit.

**Acceptance Criteria:**
- **Given** une campagne avec des missions validées, **When** le client business télécharge l'export CSV ou JSON, **Then** le fichier généré contient l'intégralité des coordonnées GPS, photos et réponses collectées.

## Design Notes

- Génération CSV streaming légère et sans dépendance lourde pour garantir des performances optimales.

## Verification

**Commands:**
- `docker compose exec backend php artisan test --filter=CampaignReportExportTest` -- expected: Tests PASS
- `curl -X GET "http://localhost:8080/api/v1/business/campaigns/1/export?format=csv" -H "Authorization: Bearer BIZ_TOKEN"` -- expected: HTTP 200 OK text/csv

## Suggested Review Order

**Contrôleur de Synthèse de Campagne & Export CSV/JSON**

- Méthodes getReport et exportData
  [`CampaignReportController.php:1`](../../backend/app/Http/Controllers/Api/Business/CampaignReportController.php#L1)

**Relations sur le Modèle Mission**

- Relation submissions sur le modèle Mission
  [`Mission.php:50`](../../backend/app/Models/Mission.php#L50)

**Routes API V1**

- Enregistrement des endpoints `/v1/business/campaigns/{id}/report` et `/v1/business/campaigns/{id}/export`
  [`api.php:75`](../../backend/routes/api.php#L75)

**Suite de Tests Automatisés**

- Tests d'intégration des métriques, des exports CSV/JSON et du contrôle multi-entreprises (403)
  [`CampaignReportExportTest.php:1`](../../backend/tests/Feature/CampaignReportExportTest.php#L1)

