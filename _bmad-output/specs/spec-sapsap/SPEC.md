---
id: SPEC-sapsap
companions:
  - mission-types.md
  - anti-fraud-rules.md
  - ../../planning-artifacts/architecture/architecture-SapSap-2026-08-26/ARCHITECTURE-SPINE.md
sources:
  - ../../../cachier-de-charge.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# SapSap — Marketplace B2B2C de Micro-Missions Terrain (MVP)

## Why

Les entreprises opérant à Ouagadougou (Burkina Faso) manquent d'un moyen rapide, abordable et vérifié pour collecter des données terrain (disponibilité de produits, relevés de prix, présence d'affichage commercial, audits de points de vente et clients mystères) sans déployer d'équipes internes coûteuses ou recruter des enquêteurs temporaires. En parallèle, les individus locaux disposent de smartphones et de trajets quotidiens qu'ils souhaitent rentabiliser via des micro-missions rémunérées en Mobile Money. SapSap résout ce double problème en connectant les entreprises avec un réseau de contributeurs géolocalisés pour exécuter et valider des vérifications terrain à forte densité dans Ouagadougou.

## Capabilities

- **CAP-1**
  - **intent:** Le contributeur peut créer un compte vérifié par OTP SMS, gérer son profil et suivre son score de réputation SapSap.
  - **success:** Un utilisateur mobile s'inscrit avec son numéro burkinabè, reçoit le code OTP, accède à son profil et visualise son score/niveau de réputation.

- **CAP-2**
  - **intent:** Le contributeur peut rechercher les missions disponibles autour de sa position GPS sur liste et carte, et réserver une mission pour une durée déterminée.
  - **success:** Les missions distantes de moins d'un rayon donné s'affichent avec leur récompense en FCFA et leur deadline, et le bouton d'acceptation réserve la mission pour 45 minutes en empêchant d'autres contributeurs de la sélectionner.

- **CAP-3**
  - **intent:** Le contributeur peut exécuter la mission sur place en validant sa position GPS (<100m), en capturant des photographies obligatoirement in-app et en remplissant le questionnaire.
  - **success:** L'application bloque la soumission si la distance GPS dépasse la tolérance ou si l'utilisateur tente d'importer une photo de sa galerie, et transmet le package de preuves horodaté au serveur.

- **CAP-4**
  - **intent:** Le contributeur peut consulter le solde de son portefeuille (en validation, disponible, total gagné) et émettre une demande de retrait vers Mobile Money (Orange Money / Moov Money) dès que son solde disponible atteint au moins 1 000 FCFA.
  - **success:** Dès la validation d'une mission (manuelle ou auto-validée à 48h), le montant est crédité sur le solde disponible et toute demande de retrait supérieure ou égale à 1 000 FCFA initie le versement Mobile Money.

- **CAP-5**
  - **intent:** L'entreprise partenaire peut créer une campagne de missions via un assistant web (type, localisation, instructions, questionnaire, budget) et effectuer le règlement de la campagne.
  - **success:** L'utilisateur Business configure sa campagne sur `business.sapsap.bf`, visualise le montant total calculé (GMV + commission), et soumet le paiement par Mobile Money ou validation manuelle.

- **CAP-6**
  - **intent:** L'entreprise peut suivre l'avancement de ses campagnes sur tableau de bord et carte interactive, et exporter l'ensemble des résultats et preuves au format CSV/Excel.
  - **success:** Le tableau de bord affiche le taux de complétion en temps réel, permet de consulter les photos/réponses par point de vente et télécharge un fichier de données CSV/Excel structuré.

- **CAP-7**
  - **intent:** L'équipe interne SapSap peut modérer les nouvelles campagnes d'entreprises, vérifier les soumissions des contributeurs dans un délai de 48 heures (avant auto-validation par le système), et administrer le KYC et les retraits.
  - **success:** L'administrateur valide sur `admin.sapsap.bf` la soumission dans un délai de 48 heures (ou le système déclenche l'auto-validation à l'échéance des 48h), ce qui transfère le paiement au portefeuille du contributeur.

- **CAP-8**
  - **intent:** Le système contrôle l'authenticité des soumissions via la vérification GPS, l'horodatage serveur, l'empreinte numérique des images (hashing) et la détection d'appareils multiples (Device ID).
  - **success:** Le système rejette automatiquement toute image soumise déjà existante en base et alerte l'administrateur en cas de comportement suspect ou de déviance de localisation.

## Constraints

- Le marché pilote MVP est strictly limité à la ville de Ouagadougou (Burkina Faso) afin de garantir une densité optimale de contributeurs.
- Les prises de vue pour l'ensemble des missions doivent être réalisées exclusivement via la caméra native in-app de SapSap avec blocage strict de la galerie photos.
- La validation de proximité GPS est obligatoire avant le déverrouillage de la prise de vue et du questionnaire (rayon maximal par défaut <= 100 mètres).
- Seuil minimal de retrait fixé à 1 000 FCFA pour toute demande de transfert vers Mobile Money (Orange Money / Moov Money).
- Délai d'auto-validation des soumissions fixé à 48 heures si l'entreprise ou l'admin n'a pas statué sur la soumission.
- L'application mobile Contributeur est développée sous Angular + Ionic + Capacitor ciblant Android. Les interfaces Business et Admin sont des applications Web Angular/React hébergées sur `business.sapsap.bf` et `admin.sapsap.bf`.
- Le backend repose sur un monolithe modulaire API REST (NestJS ou Laravel) couplé à une base de données relationnelle PostgreSQL.
- Les paiements et retraits s'effectuent via les services Mobile Money locaux (Orange Money, Moov Money).
- Interdiction absolue et filtrage des missions portant sur des sites militaires, infrastructures de sécurité, surveillance d'individus ou violations de propriété privée.

## Non-goals

- Pas de déploiement dans d'autres villes du Burkina Faso (ex: Bobo-Dioulasso) ou à l'international pendant la phase MVP.
- Pas d'application iOS publique pour les contributeurs au lancement du MVP (Android uniquement).
- Pas de fonctionnalités de réseau social, de messagerie instantanée en temps réel ou de système de parrainage complexe dans la version MVP.
- Pas d'automatisation par Intelligence Artificielle (reconnaissance d'image visuelle, détection automatique de rayon) au MVP (réservé aux phases P1/P2).
- Pas de paiement par carte bancaire ou cryptomonnaies.

## Success signal

Au moins 3 entreprises payantes à Ouagadougou réalisent avec succès une campagne complète (création -> paiement -> réalisation par le réseau -> validation -> versement des gains aux contributeurs) avec un taux d'achèvement des missions supérieur à 85% et le réengagement (repeat purchase) d'au moins 2 entreprises.

## Assumptions

- Les API des agrégateurs ou les mécanismes de paiement/retrait manuel Orange Money / Moov Money sont opérationnels au Burkina Faso.
- L'équipement smartphone Android sous Android 8+ avec GPS fonctionnel couvre plus de 90% des contributeurs potentiels à Ouagadougou.
