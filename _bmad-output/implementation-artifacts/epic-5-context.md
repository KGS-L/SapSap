# Epic 5 Context: Portefeuille Financier, Retraits Mobile Money & Exploitation des Résultats

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Fournir aux contributeurs une gestion financière transparente et sécurisée de leurs gains avec demandes de retrait Mobile Money (dès 1 000 FCFA via Orange Money et Moov Money), et offrir aux entreprises clientes (`business.sapsap.bf`) un tableau de bord analytique en temps réel avec cartographie interactive des points contrôlés à Ouagadougou et export des données terrain.

## Stories

- Story 5.1: Portefeuille Contributeur & Demande de Retrait (>= 1 000 FCFA)
- Story 5.2: Suivi de Campagne en Temps Réel & Carte des Résultats
- Story 5.3: Exportation des Données de Campagne (CSV / Excel)

## Requirements & Constraints

- **FR7 (Portefeuille Contributeur)** : Suivi des soldes (en attente, disponible, total cumulé) et retraits Mobile Money avec seuil minimal strict de 1 000 FCFA.
- **FR9 (Suivi & Cartographie Business)** : Tableau de bord de suivi en temps réel de campagne pour les entreprises, indicateurs d'avancement (% complétion, missions réalisées/total, budget consommé), cartographie interactive des points inspectés avec fiches détaillées (réponses, photos haute résolution, écart GPS).
- **NFR3 (Immuabilité Comptable)** : Grand livre à double entrée (`wallet_transactions`) avec verrouillage atomique (`lockForUpdate`) et pilote de paiement simulé (`SimulatedPaymentDriver`).
- **NFR5 (Sécurité & RBAC)** : Isolation des données par entreprise (les utilisateurs business n'accèdent qu'à leurs propres campagnes et résultats), authentification Sanctum.

## Technical Decisions

- **Architecture REST & Agrégation** : Endpoints Laravel dédiés `/api/v1/business/campaigns/{id}/tracking` et `/api/v1/business/campaigns/{id}/results-map` calculant dynamiquement les statistiques de complétion, le budget engagé/consommé, et renvoyant les points géolocalisés avec leurs soumissions associées.
- **Cartographie Web** : Leaflet / OpenStreetMap intégré dans Angular (ou SVG/Canvas haute fidélité avec tuiles cartographiques interactives et marqueurs thématiques) pour visualiser les points audités à Ouagadougou.
- **Structure Données Campagne / Mission / Soumission** : Liaison Eloquent `Campaign` -> `Mission` -> `Submission` avec chargement eager (`with(['missions.submissions', 'missions.assignedUser'])`).
- **Interface Utilisateur Business** : Interface Angular 18+ moderne avec design system SapSap (palette émeraude, cartes KPI glassmorphism, barre de progression, filtres par quartier/statut, volet d'inspection de point terrain).

## UX & Interaction Patterns

- **KPI Header** : Jauge de progression (% de complétion), budget consommé vs alloué, délai moyen de validation.
- **Carte Interactive & Vue Double (Split View)** : Carte plein écran ou côte-à-côte avec la liste des points. Clic sur un marqueur ouvrant le panneau latéral avec photos, horodatage, réponses formulaire et score contributeur.
- **Filtres Dynamiques** : Filtrage des points cartographiés par statut (`validated`, `submitted`, `in_progress`, `available`) et par quartier de Ouagadougou.

## Cross-Story Dependencies

- **Dépendance Amont (Story 5.1 & Epic 4)** : Utilise les soumissions enregistrées et validées (manuellement ou auto-validées à 48h) avec leurs photos, réponses et coordonnées GPS.
- **Dépendance Aval (Story 5.3)** : La vue de résultats et la structure des données préparée dans la Story 5.2 serviront de base directe pour les flux d'exportation CSV/Excel dans la Story 5.3.
