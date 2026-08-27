# Epic 4 Context: Modération Admin, Anti-Fraude & Job d'Auto-Validation à 48h

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permettre à l'équipe d'administration SapSap (`admin.sapsap.bf`) de modérer et publier les campagnes des entreprises, de vérifier manuellement les soumissions terrain (photos, questionnaires, tolérance GPS < 100m), de détecter et bloquer les fraudes (empreintes d'images SHA-256 dupliquées, Device ID multi-comptes) et d'assurer le paiement automatique des contributeurs via le planificateur Laravel Scheduler à 48h.

## Stories

- Story 4.1: Dashboard Admin & Modération des Campagnes
- Story 4.2: Interface de Revue Manuelle des Soumissions
- Story 4.3: Contrôle Anti-Fraude avec Empreinte SHA-256 & Device ID
- Story 4.4: Job Planifié d'Auto-Validation à 48h (Laravel Scheduler)

## Requirements & Constraints

- Les campagnes créées par les entreprises arrivent en statut `pending` (en attente de modération).
- L'administrateur peut examiner la conformité, approuver (`status: active`) ou rejeter (`status: rejected`) avec un motif explicatif obligatoire.
- Le montant du budget séquestre de la campagne doit être vérifié avant validation.
- Toutes les actions de modération doivent être protégées par les permissions Spatie (`moderate-campaigns`, `super-admin`, `validator`).

## Technical Decisions

- **Backend** : Endpoints REST `/api/v1/admin/campaigns`, `/api/v1/admin/campaigns/{id}/approve`, `/api/v1/admin/campaigns/{id}/reject`.
- **Frontend** : Service Angular `CampaignAdminService`, composant `CampaignsListComponent` et dialogue modal d'examen/rejet avec motif.
- **Modèle de données** : Table `campaigns` (id, user_id/company_id, title, description, type, city, missions_count, reward_per_mission, total_budget, status: `draft`|`pending`|`active`|`rejected`|`completed`, rejection_reason).

## UX & Interaction Patterns

- Filtrage par onglets : *En attente*, *Approuvées*, *Rejetées*, *Toutes*.
- Tiroir modal ou vue détaillée pour examiner le questionnaire, les critères de validation et le budget.
- Actions rapides : Bouton "Approuver" (vert) et "Rejeter" (rouge avec fenêtre modale de saisie du motif).

## Cross-Story Dependencies

- Story 4.1 s'appuie sur l'authentification et les permissions Spatie mises en place dans la Story 1.2.
- Les campagnes approuvées deviennent immédiatement découvrables par les contributeurs mobiles (Épic 3).
