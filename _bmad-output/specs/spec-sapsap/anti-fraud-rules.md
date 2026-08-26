# Dispositif Anti-Fraude — SapSap MVP

## Mesures Obligatoires P0 (MVP)

1. **Géofencing & Proximité GPS**
   - Comparaison de la position GPS envoyée par le smartphone avec les coordonnées de la mission.
   - Distance maximale tolérée : 100 mètres (ajustable par mission).
   - Rejet immédiat de la soumission si la tolérance de distance est dépassée.

2. **Horodatage Côté Serveur**
   - L'heure de réalisation et de soumission est exclusivement basée sur l'horloge du serveur backend API.
   - Refus strict de se fier à l'horloge locale du terminal mobile.

3. **Capture Caméra Sécurisée In-App**
   - Utilisation d'un composant caméra natif forçant la prise de vue directe.
   - Interdiction totale d'accéder au sélecteur de fichiers / galerie d'images.

4. **Empreinte Numérique des Photos (Image Hashing)**
   - Génération d'un hash pour chaque photo soumise.
   - Détection automatique du doublon si une photo identique est réutilisée entre plusieurs missions ou comptes.

5. **Traçabilité de l'Appareil (Device ID)**
   - Détection des tentatives de création de comptes multiples sur un même smartphone.
   - Signalement automatique en administration si plus de 2 comptes actifs partagent le même Device ID.

6. **Politique de Bannissement & Réputation**
   - Suivi du taux de rejet des missions par contributeur.
   - Suspension automatique ou dégradation du score SapSap en cas de rejets répétés pour suspicion de fraude.

## Évolutions Futures (P1 / P2)
- Analyse métadonnées avancée (EXIF / détection de screenshots).
- Modèle IA de reconnaissance visuelle des produits et points de vente.
- Détection d'anomalies de déplacements GPS (vitesse impossible / mock GPS).
