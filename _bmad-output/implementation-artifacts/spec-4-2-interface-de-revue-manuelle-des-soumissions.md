---
title: 'Story 4.2 : Interface de Revue Manuelle des Soumissions'
type: 'feature'
created: '2026-08-27'
status: 'done'
baseline_commit: '3c4538d3a97b356e6e06aa2d13f5bbc08c44e1ee'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les validateurs administrateurs (`admin.sapsap.bf`) et entreprises ont besoin d'une interface de revue ergonomique pour inspecter les preuves terrain soumises par les contributeurs (photos natives in-app, réponses au questionnaire, contrôle d'écart GPS < 100m) afin d'approuver le versement de la récompense ou de rejeter la soumission avec un motif explicite.

**Approach:** Créer la table et le modèle `submissions` sous Laravel, intégrer le calcul d'écart GPS (distance Haversine en mètres) et les endpoints d'administration (`/api/v1/admin/submissions`, `/api/v1/admin/submissions/{id}/validate`, `/api/v1/admin/submissions/{id}/reject`). Côté Angular (`web-admin`), développer `SubmissionAdminService`, enrichir `SubmissionsListComponent` avec un tiroir/modale d'inspection visuelle et connecter le panneau du tableau de bord.

## Boundaries & Constraints

**Always:**
- Protéger les endpoints de validation par `auth:sanctum` et permissions Spatie (`validate-submissions`, `super-admin`, `validator`).
- Calculer et afficher explicitement l'écart GPS (distance entre le point cible de la mission et la position de soumission) avec alerte visuelle si l'écart dépasse 100 mètres.
- Lors de la validation, passer le statut de la soumission à `validated`, mettre à jour le statut de la mission et créditer le score de réputation du contributeur.
- Lors du rejet, exiger un motif obligatoire (`rejection_reason`) non vide.
- Côté Angular, fournir une interface réactive avec zoom sur les photos, visualisateur des réponses et retours toast immédiats.

**Ask First:**
- Modifier le seuil de tolérance GPS standard (100 mètres).

**Never:**
- Ne jamais permettre la validation manuelle d'une soumission déjà validée ou rejetée.
- Ne jamais autoriser le rejet sans motif explicite à destination du contributeur.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Validation de soumission | Validateur clique sur "Valider" pour une soumission `submitted` (écart GPS 22m) | `POST /api/v1/admin/submissions/{id}/validate` -> Statut `validated` -> Notification succès | N/A |
| Rejet avec motif | Validateur clique sur "Rejeter" + saisit "Photo floue, enseigne non identifiable" | `POST /api/v1/admin/submissions/{id}/reject` avec `{ reason: "..." }` -> Statut `rejected` | N/A |
| Tentative de rejet sans motif | Clic sur "Confirmer Rejet" avec champ vide | Validation bloquée côté client + Erreur 422 si forcé | Message "Le motif du rejet est obligatoire" |
| Alerte GPS > 100m | Soumission avec écart GPS = 140m | Badge rouge "Alerte GPS (140m)" + Indicateur visuel d'avertissement dans l'inspecteur | N/A |
| Filtrage par statut | Clic sur onglet "À valider" / "Validées" / "Alertes GPS" | Filtrage instantané de la liste des soumissions | N/A |

</frozen-after-approval>

## Code Map

- `backend/app/Models/Submission.php` -- Modèle Eloquent de la soumission de mission.
- `backend/database/migrations/2026_08_27_000002_create_submissions_table.php` -- Migration de la table `submissions`.
- `backend/app/Http/Controllers/Api/V1/Admin/SubmissionAdminController.php` -- Contrôleur d'administration des soumissions (`index`, `show`, `validateSubmission`, `rejectSubmission`).
- `backend/routes/api.php` -- Définition des routes `/api/v1/admin/submissions/*`.
- `backend/database/seeders/SubmissionSeeder.php` -- Seeder avec soumissions réalistes à Ouagadougou.
- `web-admin/src/app/core/models/submission.model.ts` -- Interfaces TypeScript `Submission`, `SubmissionStatus`, `SubmissionCounts`.
- `web-admin/src/app/core/services/submission-admin.service.ts` -- Service Angular pour la récupération et validation des soumissions.
- `web-admin/src/app/features/submissions/submissions-list/submissions-list.component.ts` & `.html` & `.css` -- Vue de liste et tiroir d'inspection.
- `web-admin/src/app/features/dashboard/dashboard.component.ts` & `.html` -- Panneau des dernières soumissions avec actions directes.

## Tasks & Acceptance

**Execution:**
- [x] `backend/app/Models/Submission.php` -- Créer le modèle Eloquent avec relations `mission`, `user` et casts JSON -- Structurer la soumission.
- [x] `backend/database/migrations/2026_08_27_000002_create_submissions_table.php` -- Créer la table `submissions` -- Définir le schéma relationnel.
- [x] `backend/app/Http/Controllers/Api/V1/Admin/SubmissionAdminController.php` -- Implémenter `index`, `show`, `validateSubmission`, `rejectSubmission` -- Gérer la revue des preuves.
- [x] `backend/routes/api.php` -- Déclarer les routes `/api/v1/admin/submissions/*` sous `auth:sanctum` -- Exposer l'API de modération terrain.
- [x] `backend/database/seeders/SubmissionSeeder.php` -- Créer des soumissions conformes et avec alertes GPS -- Alimenter les données de test.
- [x] `web-admin/src/app/core/models/submission.model.ts` -- Définir les types des soumissions et réponses -- Assurer le typage strict.
- [x] `web-admin/src/app/core/services/submission-admin.service.ts` -- Implémenter le service réactif avec Signals -- Connecter l'API aux composants.
- [x] `web-admin/src/app/features/submissions/submissions-list/submissions-list.component.ts` & `.html` & `.css` -- Construire l'interface de revue avec inspecteur photos et GPS -- Permettre l'examen approfondi.
- [x] `web-admin/src/app/features/dashboard/dashboard.component.ts` & `.html` -- Connecter le tableau de bord aux soumissions réelles -- Afficher les soumissions en direct.

**Acceptance Criteria:**
- Given un validateur sur `/submissions`, when il examine une soumission et clique "Valider", then le statut passe à `validated`, la soumission est approuvée et le score du contributeur est mis à jour.
- Given une soumission avec un écart GPS > 100m, when affichée dans la liste, then une pastille rouge "Alerte GPS" attire l'attention du validateur.
- Given un clic sur "Rejeter", when le validateur saisit un motif et confirme, then l'API enregistre le motif et notifie le refus.

## Design Notes

L'inspecteur de soumission intègre une jauge de conformité GPS :
```typescript
getGpsStatus(distance: number): { text: string; cssClass: string } {
  return distance <= 100
    ? { text: `GPS Conforme (${distance}m <= 100m)`, cssClass: 'badge-success' }
    : { text: `Alerte Écart GPS (${distance}m > 100m)`, cssClass: 'badge-danger' };
}
```

## Verification

**Commands:**
- `npm run build` dans `web-admin` -- expected: `Application bundle generation complete` (0 erreur).
- `docker compose exec backend php artisan migrate --seed` -- expected: tables créées et seedées sans erreur.

## Suggested Review Order

**Backend Submission Data Structure & Endpoints**

- Migration de la table PostgreSQL submissions avec coordonnées et précision GPS
  [`2026_08_27_000002_create_submissions_table.php:14`](../../backend/database/migrations/2026_08_27_000002_create_submissions_table.php#L14)

- Modèle Eloquent Submission avec casts JSON
  [`Submission.php:11`](../../backend/app/Models/Submission.php#L11)

- Contrôleur d'administration pour validation et rejet de soumission
  [`SubmissionAdminController.php:12`](../../backend/app/Http/Controllers/Api/V1/Admin/SubmissionAdminController.php#L12)

- Enregistrement des routes API de soumissions
  [`api.php:30`](../../backend/routes/api.php#L30)

- Seeder avec cas de soumissions réelles et anomalies GPS
  [`SubmissionSeeder.php:14`](../../backend/database/seeders/SubmissionSeeder.php#L14)

**Frontend Web-Admin Submission Inspector**

- Modèles TypeScript Submission et SubmissionCounts
  [`submission.model.ts:3`](../../web-admin/src/app/core/models/submission.model.ts#L3)

- Service réactif Angular pour la gestion des soumissions
  [`submission-admin.service.ts:10`](../../web-admin/src/app/core/services/submission-admin.service.ts#L10)

- Composant de liste, onglets de filtrage et inspecteur de preuves
  [`submissions-list.component.ts:14`](../../web-admin/src/app/features/submissions/submissions-list/submissions-list.component.ts#L14)

- Vue HTML avec galerie de photos natives et widget de contrôle GPS
  [`submissions-list.component.html:1`](../../web-admin/src/app/features/submissions/submissions-list/submissions-list.component.html#L1)

- Connexion du Dashboard aux données réelles de soumission
  [`dashboard.component.ts:14`](../../web-admin/src/app/features/dashboard/dashboard.component.ts#L14)
