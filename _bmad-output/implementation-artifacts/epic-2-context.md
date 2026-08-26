# Epic 2 Context: Création de Campagnes & Paiement Simulé (Portail Business)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permettre aux entreprises d'accéder au portail web `business.sapsap.bf`, de configurer une campagne de missions (définition des objectifs, lieux, questionnaires, photos demandées, budget) et d'effectuer le paiement via le Simulated Payment Driver avec mise en compte séquestre immuable (`wallet_transactions`).

## Stories

- Story 2.1: Wizard de Création de Campagne sur Portail Business
- Story 2.2: Calculateur de Budget & Paiement Simulé de Campagne

## Requirements & Constraints

- **FR8** : Création de campagnes d'enquêtes/missions par les entreprises (type de mission, localisation à Ouagadougou, questions du formulaire, photos requises, budget) avec paiement initial en compte séquestre.
- **NFR3 & AD-7** : Registre comptable immuable à partie double (`wallet_transactions`) gérant l'état des fonds (`initiated`, `escrow_locked`, `released`, `withdrawn`, `failed`).
- **AD-6** : Pattern `PaymentGatewayInterface` avec implémentation `SimulatedPaymentDriver` permettant la simulation intégrale des dépôts Mobile Money (Orange Money & Moov Money).

## Technical Decisions

- **Structure de la Table `campaigns`** : PostgreSQL avec UUID v4, champs financiers en FCFA (nombres entiers), schéma du questionnaire stocké en `jsonb`, et statut (`draft`, `pending_approval`, `active`, `completed`, `cancelled`).
- **Comptabilité Séquestre** : Table `wallet_transactions` consignant l'historique financier avec solde avant/après et types de transactions (`campaign_escrow_deposit`).
- **Simulated Payment Driver** : Service `SimulatedPaymentDriver` simulant un callback réussi Orange/Moov Money et créditant l'escrow de la campagne.

## UX & Interaction Patterns

- Assistant pas-à-pas (Wizard) côté Business pour configurer la campagne, calculer en temps réel le sous-total et la commission SapSap, puis valider par paiement simulé Mobile Money.
