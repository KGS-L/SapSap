---
title: 'Story 4.3 : Contrôle Anti-Fraude avec Empreinte SHA-256 & Device ID'
type: 'feature'
created: '2026-08-27'
status: 'done'
baseline_commit: 'edf2bafb47d5b12be9649404ed5868477c3edd21'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Des utilisateurs malveillants peuvent tenter de frauder la marketplace en réutilisant des photos identiques pour plusieurs missions ou en créant plusieurs comptes sur le même smartphone afin de contourner les limites de gains et les contrôles de réputation.

**Approach:** Développer un moteur d'analyse anti-fraude côté Laravel (`FraudDetectionService`) vérifiant les empreintes de hachage SHA-256 des images (`media_fingerprints`) et la mutualisation de `device_id` (> 2 comptes). Côté Angular (`web-admin`), créer le module `/fraud` (`FraudAlertsComponent`) permettant aux administrateurs d'inspecter les anomalies détectées, de comparer les preuves dupliquées et d'appliquer des sanctions (avertissement, pénalité de score ou suspension de compte).

## Boundaries & Constraints

**Always:**
- Calculer et indexer l'empreinte numérique SHA-256 de tout fichier image soumis par un contributeur.
- Lever immédiatement une alerte anti-fraude si un hash SHA-256 a déjà été enregistré lors d'une soumission antérieure.
- Surveiller les identifiants d'appareils (`device_id`) et créer une alerte critique si plus de 2 comptes distincts se connectent depuis le même terminal.
- Protéger les endpoints d'administration anti-fraude par `auth:sanctum` et permission `view-fraud-alerts` / `super-admin`.
- Tracer chaque décision d'investigation (`resolved`, `dismissed`) avec horodatage et identité du validateur.

**Ask First:**
- Modifier le seuil de tolérance de multi-comptes par terminal (seuil par défaut : 2 comptes maximum).

**Never:**
- Ne jamais supprimer silencieusement des traces de fraude du registre `media_fingerprints`.
- Ne jamais autoriser le versement automatique d'une rémunération sur une soumission marquée comme `fraud_suspect`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Image dupliquée détectée | Envoi d'une photo ayant un hash SHA-256 déjà présent en base | Alerte créée avec type `duplicate_image`, sévérité `high`, soumission marquée `fraud_suspect` | N/A |
| Multi-compte sur 1 smartphone | Un 3e compte contributeur utilise le `device_id` `DEV-BF-OUAGA-8888` | Alerte créée avec type `device_sharing`, sévérité `high`, liste des 3 comptes associés | N/A |
| Décision administrateur : Sanctionner | Admin sélectionne "Suspendre le compte" ou "Pénalité score" | Compte suspendu (`is_active = false`) ou score décrémenté, alerte marquée `resolved` | Notification succès |
| Fausse alerte classée | Admin vérifie et constate une fausse alerte | Alerte marquée `dismissed` avec motif de classement | N/A |

</frozen-after-approval>

## Code Map

- `backend/app/Models/MediaFingerprint.php` -- Modèle Eloquent des empreintes numériques de fichiers.
- `backend/app/Models/FraudAlert.php` -- Modèle Eloquent des alertes de fraude.
- `backend/database/migrations/2026_08_27_000003_create_fraud_detection_tables.php` -- Migration des tables anti-fraude.
- `backend/app/Services/FraudDetectionService.php` -- Service métier d'analyse SHA-256 et Device ID.
- `backend/app/Http/Controllers/Api/V1/Admin/FraudAdminController.php` -- Contrôleur API de gestion des alertes (`index`, `show`, `resolveAlert`, `dismissAlert`).
- `backend/routes/api.php` -- Définition des routes `/api/v1/admin/fraud/*`.
- `backend/database/seeders/FraudAlertSeeder.php` -- Seeder avec cas réels de duplication d'image et partage d'appareil.
- `web-admin/src/app/core/models/fraud.model.ts` -- Interfaces TypeScript `FraudAlert`, `FraudStats`.
- `web-admin/src/app/core/services/fraud-admin.service.ts` -- Service Angular pour la supervision anti-fraude.
- `web-admin/src/app/features/fraud/fraud-alerts/fraud-alerts.component.ts` & `.html` & `.css` -- Tableau de bord de supervision anti-fraude.

## Tasks & Acceptance

**Execution:**
- [x] `backend/database/migrations/2026_08_27_000003_create_fraud_detection_tables.php` -- Créer `media_fingerprints` et `fraud_alerts` -- Schéma de persistance des fraudes.
- [x] `backend/app/Models/MediaFingerprint.php` & `FraudAlert.php` -- Créer les modèles Eloquent avec relations -- Structurer les données d'audit.
- [x] `backend/app/Services/FraudDetectionService.php` -- Implémenter les méthodes de détection de hash SHA-256 et Device ID -- Fournir le moteur d'analyse.
- [x] `backend/app/Http/Controllers/Api/V1/Admin/FraudAdminController.php` -- Implémenter la liste, l'examen et les actions de résolution -- Gérer les alertes.
- [x] `backend/routes/api.php` -- Déclarer les routes `/api/v1/admin/fraud/*` sous `auth:sanctum` -- Exposer l'API anti-fraude.
- [x] `backend/database/seeders/FraudAlertSeeder.php` -- Créer des alertes d'image dupliquée et multi-comptes -- Alimenter les données de test.
- [x] `web-admin/src/app/core/models/fraud.model.ts` -- Définir les types TypeScript d'alertes -- Assurer le typage strict.
- [x] `web-admin/src/app/core/services/fraud-admin.service.ts` -- Développer le service Angular réactif -- Connecter l'API de supervision.
- [x] `web-admin/src/app/features/fraud/fraud-alerts/fraud-alerts.component.ts` & `.html` & `.css` -- Construire l'interface d'investigation -- Permettre le traitement des alertes.

**Acceptance Criteria:**
- Given un administrateur sur `/fraud`, when il consulte la liste, then les alertes d'images dupliquées et de partage de Device ID s'affichent avec leurs niveaux de sévérité.
- Given une alerte d'image dupliquée, when l'admin clique sur "Investiguer", then la modale affiche les soumissions concernées avec le hash SHA-256 commun.
- Given une action de sanction, when validée, then l'alerte passe en statut `resolved` et l'action est enregistrée.

## Design Notes

Badge visuel de sévérité d'alerte :
```typescript
getSeverityBadge(severity: string): { label: string; cssClass: string } {
  switch (severity) {
    case 'high': return { label: 'Critique', cssClass: 'badge-danger' };
    case 'medium': return { label: 'Moyenne', cssClass: 'badge-warning' };
    default: return { label: 'Faible', cssClass: 'badge-info' };
  }
}
```

## Verification

**Commands:**
- `npm run build` dans `web-admin` -- expected: `Application bundle generation complete` (0 erreur).
- `docker compose exec backend php artisan migrate --seed` -- expected: tables anti-fraude créées et seedées sans erreur.

## Suggested Review Order

**Moteur d'Analyse Anti-Fraude (Backend Laravel)**

- Moteur de détection d'images dupliquées SHA-256 et mutualisation de Device ID
  [`FraudDetectionService.php:15`](../../backend/app/Services/FraudDetectionService.php#L15)

- Contrôleur d'administration pour lister, examiner et sanctionner les alertes
  [`FraudAdminController.php:16`](../../backend/app/Http/Controllers/Api/V1/Admin/FraudAdminController.php#L16)

- Schéma de base de données pour les empreintes SHA-256 et les alertes d'audit
  [`2026_08_27_000003_create_fraud_detection_tables.php:14`](../../backend/database/migrations/2026_08_27_000003_create_fraud_detection_tables.php#L14)

- Déclaration des routes API sécurisées `/api/v1/admin/fraud/*`
  [`api.php:42`](../../backend/routes/api.php#L42)

**Interface de Supervision Anti-Fraude (Frontend Angular)**

- Interface TypeScript des alertes et détails d'empreinte
  [`fraud.model.ts:1`](../../web-admin/src/app/core/models/fraud.model.ts#L1)

- Service Angular de gestion des alertes et des sanctions
  [`fraud-admin.service.ts:10`](../../web-admin/src/app/core/services/fraud-admin.service.ts#L10)

- Contrôleur du composant de supervision et d'investigation
  [`fraud-alerts.component.ts:14`](../../web-admin/src/app/features/fraud/fraud-alerts/fraud-alerts.component.ts#L14)

- Vue HTML avec KPIs, comparaison visuelle côte-à-côte et modales d'action
  [`fraud-alerts.component.html:1`](../../web-admin/src/app/features/fraud/fraud-alerts/fraud-alerts.component.html#L1)

**Tests & Validation**

- Suite de tests automatisés couvrant les 4 scénarios de la matrice
  [`FraudDetectionTest.php:15`](../../backend/tests/Feature/FraudDetectionTest.php#L15)
