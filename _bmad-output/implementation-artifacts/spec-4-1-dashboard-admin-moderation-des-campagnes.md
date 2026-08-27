---
title: 'Story 4.1 : Dashboard Admin & Modération des Campagnes'
type: 'feature'
created: '2026-08-27'
status: 'done'
baseline_commit: 'dc9fd9cea14632cd5c4959d71531eb2f97a3f9de'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Les campagnes créées par les entreprises doivent être modérées et validées par les administrateurs de SapSap avant d'être diffusées aux contributeurs mobiles, afin d'assurer la conformité légale des missions, la clarté des questionnaires et la solvabilité du budget séquestre.

**Approach:** Créer les modèles et tables `campaigns` et `missions` sous Laravel avec les endpoints `/api/v1/admin/campaigns`, `/api/v1/admin/campaigns/{id}/approve`, `/api/v1/admin/campaigns/{id}/reject`. Côté Angular (`web-admin`), développer le service réactif `CampaignAdminService`, connecter `CampaignsListComponent` et `DashboardComponent` aux données réelles de l'API avec les actions d'approbation et de rejet avec motif modal.

## Boundaries & Constraints

**Always:**
- Protéger les endpoints de modération par `auth:sanctum` et vérification de rôle/permission (`super-admin` ou `validator`).
- Lors de l'approbation, passer la campagne en statut `active` et rendre ses missions disponibles aux contributeurs.
- Lors d'un rejet, exiger obligatoirement un motif non vide (`rejection_reason`) pour expliciter le refus à l'entreprise.
- Côté Angular, afficher des retours d'état visuels immédiats (badges, toasts de confirmation, compteurs de badges synchronisés).

**Ask First:**
- Modifier le cycle de vie des statuts de campagne (`draft` -> `pending` -> `active` / `rejected` -> `completed`).

**Never:**
- Ne jamais permettre l'approbation d'une campagne sans budget séquestre valide (> 0 FCFA).
- Ne jamais autoriser une entreprise à auto-approuver ses propres campagnes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Approbation réussie | Clic sur "Approuver" pour campagne `pending` | `POST /api/v1/admin/campaigns/{id}/approve` -> Statut `active` -> Toast succès | N/A |
| Rejet avec motif | Clic sur "Rejeter" + saisie du motif "Photos demandées non conformes" | `POST /api/v1/admin/campaigns/{id}/reject` avec `{ reason: "..." }` -> Statut `rejected` | N/A |
| Rejet avec motif vide | Clic sur "Confirmer Rejet" sans saisir de texte | Blocage côté client + Erreur HTTP 422 si forcé | Message d'erreur "Le motif du rejet est obligatoire" |
| Filtrage par onglet | Clic sur "En attente" / "Approuvées" / "Toutes" | Filtrage instantané de la liste des campagnes | N/A |
| Liste vide | Aucune campagne dans l'onglet sélectionné | Affichage du message d'état vide "Aucune campagne trouvée" | N/A |

</frozen-after-approval>

## Code Map

- `backend/app/Models/Campaign.php` -- Modèle Eloquent de la campagne.
- `backend/app/Models/Mission.php` -- Modèle Eloquent des missions de terrain rattachées.
- `backend/database/migrations/2026_08_27_000001_create_campaigns_and_missions_tables.php` -- Migration des tables `campaigns` et `missions`.
- `backend/app/Http/Controllers/Api/V1/Admin/CampaignAdminController.php` -- Contrôleur d'administration des campagnes (`index`, `show`, `approve`, `reject`).
- `backend/routes/api.php` -- Définition des routes `/api/v1/admin/campaigns/*`.
- `backend/database/seeders/CampaignSeeder.php` -- Seeder avec 3 campagnes réalistes à Ouagadougou.
- `web-admin/src/app/core/models/campaign.model.ts` -- Interfaces TypeScript `Campaign`, `Mission`, `CampaignStatus`.
- `web-admin/src/app/core/services/campaign-admin.service.ts` -- Service Angular pour la récupération et modération des campagnes.
- `web-admin/src/app/features/campaigns/campaigns-list/campaigns-list.component.ts` & `.html` & `.css` -- Vue de liste et modale de rejet.
- `web-admin/src/app/features/dashboard/dashboard.component.ts` & `.html` -- Vue résumé des campagnes en attente avec actions directes.

## Tasks & Acceptance

**Execution:**
- [x] `backend/app/Models/Campaign.php` & `Mission.php` -- Créer les modèles Eloquent avec relations et casts -- Structurer les entités de campagne.
- [x] `backend/database/migrations/2026_08_27_000001_create_campaigns_and_missions_tables.php` -- Créer les tables `campaigns` et `missions` -- Définir le schéma relationnel en base.
- [x] `backend/app/Http/Controllers/Api/V1/Admin/CampaignAdminController.php` -- Implémenter les méthodes `index`, `approve`, `reject` -- Gérer les actions de modération.
- [x] `backend/routes/api.php` -- Déclarer les routes `/api/v1/admin/campaigns/*` sous middleware `auth:sanctum` -- Exposer l'API de modération.
- [x] `backend/database/seeders/CampaignSeeder.php` -- Créer des campagnes en attente et approuvées de test -- Alimenter les données initiales.
- [x] `web-admin/src/app/core/models/campaign.model.ts` -- Définir les interfaces TypeScript des campagnes et missions -- Assurer le typage strict.
- [x] `web-admin/src/app/core/services/campaign-admin.service.ts` -- Implémenter le service Angular avec Signals réactifs et méthodes API -- Gérer l'état des campagnes.
- [x] `web-admin/src/app/features/campaigns/campaigns-list/campaigns-list.component.ts` & `.html` & `.css` -- Brancher la liste, les filtres et la modale de rejet -- Permettre la modération interactive.
- [x] `web-admin/src/app/features/dashboard/dashboard.component.ts` & `.html` -- Connecter le panneau du tableau de bord aux campagnes en attente -- Afficher les alertes et actions rapides.

**Acceptance Criteria:**
- Given un administrateur sur `/campaigns`, when il clique sur "Valider" pour une campagne en attente, then l'API passe son statut à `active`, la campagne est marquée comme approuvée et le compteur des badges est décrémenté.
- Given un administrateur ouvrant la modale de rejet, when il saisit un motif et valide, then l'API enregistre le `rejection_reason` et passe le statut à `rejected`.
- Given le tableau de bord `/dashboard`, when des campagnes sont en attente, then la liste mini affiche les titres, entreprises, budgets et boutons d'action rapide.

## Design Notes

L'action de rejet côté Angular utilise une modale légère et accessible :
```typescript
rejectCampaign(id: string, reason: string): void {
  this.campaignService.rejectCampaign(id, reason).subscribe({
    next: () => this.loadCampaigns()
  });
}
```

## Verification

**Commands:**
- `npm run build` dans `web-admin` -- expected: `Application bundle generation complete` (0 erreur).
- `docker compose exec backend php artisan migrate --seed` -- expected: tables `campaigns` et `missions` créées et seedées sans erreur.

## Suggested Review Order

**Backend Campaign Management & Moderation Endpoints**

- Migration des tables PostgreSQL pour les campagnes et missions
  [`2026_08_27_000001_create_campaigns_and_missions_tables.php:14`](../../backend/database/migrations/2026_08_27_000001_create_campaigns_and_missions_tables.php#L14)

- Modèle Eloquent Campaign avec relations et casts
  [`Campaign.php:11`](../../backend/app/Models/Campaign.php#L11)

- Contrôleur d'administration pour approbation et rejet avec motif
  [`CampaignAdminController.php:12`](../../backend/app/Http/Controllers/Api/V1/Admin/CampaignAdminController.php#L12)

- Déclaration des routes protégées de modération
  [`api.php:24`](../../backend/routes/api.php#L24)

- Seeder de campagnes réalistes à Ouagadougou
  [`CampaignSeeder.php:13`](../../backend/database/seeders/CampaignSeeder.php#L13)

**Frontend Web-Admin Moderation Interface**

- Service réactif Angular pour la modération des campagnes
  [`campaign-admin.service.ts:10`](../../web-admin/src/app/core/services/campaign-admin.service.ts#L10)

- Composant de liste, onglets de filtrage et modales
  [`campaigns-list.component.ts:14`](../../web-admin/src/app/features/campaigns/campaigns-list/campaigns-list.component.ts#L14)

- Vue HTML avec table de données et dialogue modal de motif
  [`campaigns-list.component.html:1`](../../web-admin/src/app/features/campaigns/campaigns-list/campaigns-list.component.html#L1)

- Connexion du Dashboard aux campagnes en attente
  [`dashboard.component.ts:13`](../../web-admin/src/app/features/dashboard/dashboard.component.ts#L13)
