---
title: 'Story 4.4 : Job Planifié d''Auto-Validation à 48h (Laravel Scheduler)'
type: 'feature'
created: '2026-08-27'
status: 'done'
baseline_commit: '7a89b3f4c12d5e67a890f123456789abcdef0123'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Lorsqu'une entreprise ou un modérateur admin tarde à examiner une soumission terrain conforme déposée par un contributeur, ce dernier ne doit pas être pénalisé par des délais de rémunération indéfinis.

**Approach:** Développer un mécanisme d'auto-validation automatique orchestré par le planificateur Laravel Scheduler (`CheckPendingSubmissionsJob` exécuté chaque heure via `routes/console.php`). Le job cible les soumissions en statut `submitted` dont la date de création dépasse 48 heures sans décision (`now()->subHours(48)`), les passe en statut `validated`, renseigne `auto_validated_at`, met à jour la mission associée et incrémente le score de réputation du contributeur. Côté Angular (`web-admin`), créer la console de monitoring du Scheduler dans `/settings` avec statistiques d'exécution, journal d'audit (`scheduler_logs`), bouton de déclenchement d'urgence immédiat, et badges distinctifs `⚡ Auto-validée (48h)` dans `/submissions`.

## Boundaries & Constraints

**Always:**
- Exécuter la recherche uniquement sur les soumissions `status: submitted` ayant plus de 48 heures d'inactivité (`created_at <= now()->subHours(48)`).
- Exclure rigoureusement toute soumission marquée `fraud_suspect` ou ayant une alerte de fraude ouverte.
- Tracer chaque passage (automatique horaire ou manuel d'urgence) dans la table `scheduler_logs` avec l'horodatage, le nombre de soumissions traitées, la durée en ms et le statut.
- Protéger les endpoints `/api/v1/admin/scheduler/*` par `auth:sanctum` et permissions Spatie admin.
- Côté Angular, fournir un retour visuel immédiat (toast, rafraîchissement des compteurs et de l'historique d'audit).

**Ask First:**
- Modifier le seuil de délai d'auto-validation (fixé à 48 heures par défaut).

**Never:**
- Ne jamais auto-valider une soumission déjà rejetée ou marquée comme fraude suspecte.
- Ne jamais exécuter de mutation financière sans consigner l'enregistrement dans le journal de traçabilité.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Soumission > 48h sans action | Soumission SUB-004 `created_at` = -52h, `status: submitted` | Passage à `status: validated`, `auto_validated_at = now()`, mission `validated`, score +2 | N/A |
| Soumission récente (< 48h) | Soumission SUB-001 `created_at` = -15 min | Reste inchangée en `status: submitted`, ignorée par le job | N/A |
| Soumission suspecte > 48h | Soumission SUB-003 `status: fraud_suspect`, `created_at` = -60h | Ignorée par le job, reste en `fraud_suspect` en attente de modération manuelle | N/A |
| Déclenchement manuel Admin | Clic sur "⚡ Exécuter l'Auto-Validation Maintenant" dans `/settings` | `POST /api/v1/admin/scheduler/run-auto-validation` -> traitement immédiat -> Log `triggered_by: manual_admin` | Toast de confirmation |
| Planificateur sans élément | Exécution horaire sans soumission éligible | Log enregistré avec `processed_count: 0`, statut `success` | N/A |

</frozen-after-approval>

## Code Map

- `backend/database/migrations/2026_08_27_000004_create_scheduler_logs_table.php` -- Migration de la table d'audit des exécutions du Scheduler.
- `backend/app/Models/SchedulerLog.php` -- Modèle Eloquent pour l'archivage et le monitoring des jobs.
- `backend/app/Services/AutoValidationService.php` -- Service métier d'auto-validation à 48h, calcul des métriques et logs.
- `backend/app/Jobs/CheckPendingSubmissionsJob.php` -- Job Laravel planifié exécuté chaque heure.
- `backend/app/Console/Commands/AutoValidateSubmissionsCommand.php` -- Commande Artisan `submissions:auto-validate`.
- `backend/routes/console.php` -- Déclaration de la planification `Schedule::job(new CheckPendingSubmissionsJob(48))->hourly()`.
- `backend/app/Http/Controllers/Api/V1/Admin/SchedulerAdminController.php` -- Contrôleur d'administration (`getStatus`, `runAutoValidation`, `getLogs`).
- `backend/routes/api.php` -- Définition des routes `/api/v1/admin/scheduler/*`.
- `backend/database/seeders/SubmissionSeeder.php` -- Seeder avec soumissions antérieures à 48h et logs initiaux.
- `backend/tests/Feature/AutoValidationSchedulerTest.php` -- Tests unitaires et fonctionnels du Scheduler.
- `web-admin/src/app/core/models/scheduler.model.ts` -- Interfaces TypeScript `SchedulerStats`, `SchedulerLog`, `AutoValidationRunResult`.
- `web-admin/src/app/core/services/scheduler-admin.service.ts` -- Service Angular de supervision et déclenchement réactif.
- `web-admin/src/app/features/settings/settings.component.ts` & `.html` & `.css` -- Console de supervision temps réel et journal d'audit.
- `web-admin/src/app/features/submissions/submissions-list/submissions-list.component.ts` & `.html` & `.css` -- Vue de liste avec onglet et badges `⚡ Auto-validée (48h)`.

## Tasks & Acceptance

**Execution:**
- [x] `backend/database/migrations/2026_08_27_000004_create_scheduler_logs_table.php` -- Créer la table `scheduler_logs` -- Assurer la traçabilité des exécutions.
- [x] `backend/app/Models/SchedulerLog.php` -- Créer le modèle Eloquent avec casts JSON et relations -- Structurer l'audit.
- [x] `backend/app/Services/AutoValidationService.php` -- Implémenter la logique d'auto-validation, exclusion anti-fraude et calcul des métriques -- Fournir le moteur d'exécution.
- [x] `backend/app/Jobs/CheckPendingSubmissionsJob.php` -- Créer le job planifié -- Permettre l'automatisation horaire.
- [x] `backend/app/Console/Commands/AutoValidateSubmissionsCommand.php` -- Créer la commande Artisan -- Permettre le déclenchement CLI.
- [x] `backend/routes/console.php` -- Déclarer la fréquence horaire dans le planificateur -- Activer le scheduler.
- [x] `backend/app/Http/Controllers/Api/V1/Admin/SchedulerAdminController.php` & `routes/api.php` -- Exposer les endpoints de statut, déclenchement et logs -- Connecter le backend à l'administration.
- [x] `backend/database/seeders/SubmissionSeeder.php` -- Enrichir les données de test avec des soumissions antérieures à 48h -- Valider les scénarios.
- [x] `backend/tests/Feature/AutoValidationSchedulerTest.php` -- Rédiger les tests de validation à 48h et d'exclusion de fraude -- Garantir la non-régression.
- [x] `web-admin/src/app/core/models/scheduler.model.ts` & `scheduler-admin.service.ts` -- Développer le modèle et service Angular -- Connecter l'API de supervision.
- [x] `web-admin/src/app/features/settings/settings.component.ts` & `.html` & `.css` -- Construire la console de supervision du scheduler avec bouton de déclenchement -- Permettre le monitoring.
- [x] `web-admin/src/app/features/submissions/submissions-list/submissions-list.component.ts` & `.html` & `.css` -- Intégrer l'onglet et le badge `⚡ Auto-validée (48h)` -- Signaler visuellement les auto-validations.

**Acceptance Criteria:**
- Given le planificateur Laravel exécutant `CheckPendingSubmissionsJob` chaque heure, when une soumission reste en `submitted` depuis plus de 48h, then son statut passe à `validated`, `auto_validated_at` est renseigné et le score contributeur est incrémenté.
- Given une soumission marquée `fraud_suspect`, when le job s'exécute, then la soumission est ignorée et n'est pas auto-validée.
- Given un administrateur sur `/settings`, when il clique sur "⚡ Exécuter l'Auto-Validation Maintenant", then le job s'exécute immédiatement, valide les soumissions éligibles et actualise le journal d'audit en temps réel.
- Given une soumission auto-validée sur `/submissions`, when affichée, then le badge `⚡ Auto-validée (48h)` et la bannière d'information dans la modale d'inspection précisent l'intervention du planificateur.

## Verification

**Commands:**
- `npm run build` dans `web-admin` -- expected: `Application bundle generation complete` (0 erreur).
- `php -l` sur tous les fichiers PHP du backend -- expected: aucune erreur de syntaxe.
