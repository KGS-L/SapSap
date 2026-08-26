# Matrice des Types de Missions MVP — SapSap

| Catégorie | Description | Preuves Requises | Durée Est. | Rémunération Indicative |
|---|---|---|---|---|
| **Vérification terrain** | Confirmation simple d'existence, présence produit, relevé de prix ou vérification d'affichage commercial. | GPS (<100m), 1-2 Photos in-app, 1-3 questions rapides | 5-10 min | 1 000 - 1 500 FCFA |
| **Audit point de vente** | Contrôle structuré en magasin (présence, placement, prix concurrents, affichage publicitaire, état linéaire). | GPS (<100m), 3-5 Photos in-app, Questionnaire complet | 15-20 min | 2 000 - 3 500 FCFA |
| **Client mystère** | Visite d'un établissement en client ordinaire pour évaluer l'accueil, l'attente, la qualité de service et la conformité. | GPS (<100m), Photo de devanture, Questionnaire détaillé post-visite | 20-30 min | 2 500 - 5 000 FCFA |

## Règles Générales de Validation des Missions

1. **Localisation GPS** : Le contributeur doit valider sa présence dans le rayon défini (par défaut 100m) avant de débloquer le questionnaire et la caméra.
2. **Caméra In-App** : Les photos doivent obligatoirement inclure les métadonnées (latitude, longitude, horodatage serveur). L'importation depuis la galerie mobile est désactivée.
3. **Réservation Temporelle** : Toute mission acceptée par un contributeur lui est réservée pour un délai fixé (ex: 45 min). En cas de non-soumission à l'expiration du délai, la mission repasse en statut `disponible` dans la marketplace.
