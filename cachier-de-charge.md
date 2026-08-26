# Cahier des charges — SapSap

**Version :** MVP v1.0
**Projet :** SapSap
**Domaine :** `sapsap.bf`
**Marché pilote :** Ouagadougou, Burkina Faso
**Type de produit :** Marketplace B2B2C de micro-missions terrain rémunérées

---

# 1. Présentation du projet

## 1.1 Nom

**SapSap**

Le nom fait référence à l'expression populaire utilisée au Burkina Faso pour exprimer l'idée de faire quelque chose rapidement.

La rapidité constitue justement l'une des promesses principales du produit.

---

# 2. Vision

SapSap ambitionne de devenir un réseau de contributeurs terrain permettant aux entreprises d'obtenir rapidement des informations vérifiées depuis différents endroits.

Une entreprise peut ainsi demander à une personne située à proximité :

* de vérifier la disponibilité d'un produit ;
* de relever un prix ;
* de prendre des photos ;
* de vérifier un affichage commercial ;
* d'effectuer un contrôle dans un point de vente ;
* de tester une expérience client ;
* de répondre à un questionnaire terrain.

Le contributeur réalise la mission avec son smartphone et reçoit une rémunération après validation.

---

# 3. Proposition de valeur

## Pour les entreprises

> **Besoin de vérifier quelque chose sur le terrain ? SapSap envoie quelqu'un.**

SapSap permet notamment de réduire :

* les déplacements des employés ;
* le coût des contrôles terrain ;
* le temps nécessaire pour collecter des données ;
* les difficultés liées au recrutement ponctuel d'enquêteurs.

---

## Pour les contributeurs

> **Des missions autour de toi. Réalise-les et gagne de l'argent.**

Un utilisateur peut profiter de son temps libre et de ses déplacements pour accomplir de petites missions rémunérées.

---

# 4. Objectif du MVP

Le MVP n'a pas pour objectif de construire immédiatement toute la vision SapSap.

Son objectif principal est de répondre à une question :

> **Des entreprises de Ouagadougou sont-elles prêtes à payer régulièrement pour obtenir des vérifications terrain réalisées par le réseau SapSap ?**

Le MVP doit donc permettre d'effectuer le cycle complet :

```text
Entreprise
↓
Création d'une campagne
↓
Paiement
↓
Publication des missions
↓
Contributeur
↓
Réalisation terrain
↓
Soumission des preuves
↓
Validation
↓
Entreprise reçoit les résultats
↓
C
ontributeur reçoit sa rémunération
```

---

# 5. Marché initial

Le MVP sera limité à :

## Ouagadougou

Le lancement national est volontairement exclu.

Cette stratégie permet d'obtenir une densité suffisante de contributeurs.

Une marketplace terrain fonctionne mieux avec :

> 300 contributeurs concentrés à Ouagadougou

qu'avec :

> 300 contributeurs dispersés sur tout le Burkina Faso.

---

# 6. Utilisateurs de la plateforme

SapSap comporte trois rôles principaux.

## 6.1 Contributeur

Personne réalisant les missions terrain.

Support principal :

**Application mobile**

---

## 6.2 Entreprise

Organisation commandant les missions.

Peut être :

* marque ;
* restaurant ;
* boutique ;
* distributeur ;
* entreprise de services ;
* agence marketing ;
* fintech ;
* startup ;
* réseau commercial.

Support principal :

**Application web**

---

## 6.3 Administrateur SapSap

Équipe interne responsable du contrôle et de l'exploitation.

Support :

**Dashboard web**

---

# 7. Types de missions du MVP

Le MVP sera volontairement limité à trois catégories.

---

# 7.1 Vérification terrain

Mission simple destinée à confirmer une information.

Exemples :

* vérifier qu'un commerce existe ;
* vérifier qu'un produit est disponible ;
* relever un prix ;
* vérifier un affichage ;
* prendre une photographie ;
* confirmer une information visible.

### Exemple

**Mission**

> Vérifier la disponibilité de Coca-Cola 1,5 L.

Lieu :

> Boutique X — Patte d'Oie.

Questions :

* Le produit est-il disponible ?
* Quel est son prix ?
* Est-il réfrigéré ?

Preuves :

* GPS ;
* photographie.

Rémunération :

> 1 500 FCFA.

---

# 7.2 Audit point de vente

Mission plus structurée.

Elle peut contenir :

* plusieurs photos ;
* questionnaire ;
* contrôle de standards ;
* observation de produits concurrents.

### Exemple

Une marque souhaite vérifier :

* présence du produit ;
* placement ;
* prix ;
* concurrence ;
* affichage publicitaire.

---

# 7.3 Client mystère

Le contributeur visite un établissement comme un client normal.

Il évalue notamment :

* accueil ;
* disponibilité ;
* temps d'attente ;
* qualité du service ;
* respect de certaines procédures.

Un questionnaire lui est présenté après sa visite.

---

# 8. Fonctionnalités — Application Contributeur

## 8.1 Inscription

L'utilisateur doit pouvoir créer un compte avec :

* numéro de téléphone ;
* mot de passe ou OTP ;
* prénom ;
* nom ;
* date de naissance ;
* ville ;
* quartier.

---

# 8.2 Vérification téléphone

Un code OTP est envoyé.

Objectifs :

* limiter les faux comptes ;
* sécuriser les paiements ;
* permettre les notifications SMS.

---

# 8.3 Profil contributeur

Le profil contient :

* nom ;
* photo ;
* téléphone ;
* ville ;
* quartier ;
* date d'inscription ;
* nombre de missions ;
* taux de réussite ;
* score SapSap ;
* portefeuille.

---

# 8.4 KYC

Le MVP peut avoir deux niveaux.

### Niveau 1

Téléphone vérifié.

Permet les missions basiques.

### Niveau 2

Identité vérifiée.

Documents possibles :

* CNIB ;
* passeport.

Permet les missions mieux rémunérées.

---

# 8.5 Liste des missions

Page principale :

## Missions autour de moi

Chaque carte contient :

* titre ;
* récompense ;
* distance ;
* durée estimée ;
* quartier ;
* deadline ;
* type de mission.

Exemple :

```text
Vérifier un produit

📍 Patte d'Oie
📏 1,2 km
⏱ 10 min

+1 500 FCFA

[ Voir la mission ]
```

---

# 8.6 Carte

Une carte affiche les missions autour du contributeur.

Filtres :

* distance ;
* récompense ;
* type ;
* disponibilité.

---

# 8.7 Détail d'une mission

Afficher :

* description ;
* instructions ;
* localisation ;
* récompense ;
* questions ;
* preuves nécessaires ;
* durée estimée ;
* délai.

CTA :

**Accepter la mission**

---

# 8.8 Réservation d'une mission

Lorsqu'un contributeur accepte une mission :

la mission peut lui être réservée temporairement.

Exemple :

> Mission réservée pendant 45 minutes.

Si elle n'est pas réalisée :

> retour automatique dans la marketplace.

---

# 8.9 Navigation

Bouton :

**Ouvrir l'itinéraire**

Possibilité d'utiliser :

* Google Maps ;
* autre application cartographique disponible.

---

# 8.10 Contrôle GPS

Avant la réalisation :

SapSap vérifie que l'utilisateur se trouve suffisamment proche.

Exemple :

```text
Distance maximale autorisée : 100 mètres
```

Le rayon pourra varier suivant la mission.

---

# 8.11 Prise de photo

Les photographies doivent être prises directement depuis SapSap.

Pour certaines missions :

> interdiction d'importer depuis la galerie.

Métadonnées associées :

* mission ;
* utilisateur ;
* latitude ;
* longitude ;
* date ;
* heure.

---

# 8.12 Questionnaire

Le contributeur répond aux questions définies par l'entreprise.

Types :

* oui/non ;
* choix unique ;
* choix multiple ;
* texte ;
* nombre ;
* prix ;
* note ;
* photographie.

---

# 8.13 Soumission

Avant envoi :

SapSap affiche un résumé.

```text
Mission terminée

✓ GPS vérifié
✓ 3 photos
✓ 7/7 questions

[ Envoyer ]
```

---

# 8.14 Statut d'une mission

Une mission peut être :

* disponible ;
* réservée ;
* en cours ;
* soumise ;
* en vérification ;
* validée ;
* rejetée ;
* expirée.

---

# 8.15 Historique

Le contributeur peut consulter :

* missions terminées ;
* missions rejetées ;
* gains ;
* dates.

---

# 9. Portefeuille SapSap

Chaque contributeur dispose d'un portefeuille.

Exemple :

```text
SOLDE DISPONIBLE
8 750 FCFA

EN VALIDATION
2 000 FCFA

TOTAL GAGNÉ
34 500 FCFA
```

---

# 9.1 Paiement

Après validation :

la récompense est créditée sur le portefeuille.

---

# 9.2 Retrait

Méthodes envisagées :

* Orange Money ;
* Moov Money ;
* autres solutions compatibles.

Possibilité d'utiliser un agrégateur de paiement.

---

# 9.3 Minimum de retrait

Exemple initial :

> 1 000 ou 2 000 FCFA.

Le montant définitif sera déterminé suivant les frais de transaction.

---

# 10. Gamification et réputation

Chaque contributeur possède un :

## Score SapSap

Exemple :

```text
Score : 92 / 100
```

Calcul possible :

* taux de validation ;
* missions abandonnées ;
* qualité des photos ;
* ponctualité ;
* fraude ;
* ancienneté.

---

# 10.1 Niveaux

### Niveau 1

Débutant

### Niveau 2

Vérifié

### Niveau 3

Fiable

### Niveau 4

Expert

Certaines missions pourront demander :

> Score minimum : 85.

---

# 11. Application Business

Accessible depuis le web.

Exemple :

`business.sapsap.bf`

---

# 11.1 Création de compte entreprise

Informations :

* nom entreprise ;
* responsable ;
* téléphone ;
* email ;
* RCCM éventuellement ;
* secteur ;
* logo.

---

# 11.2 Dashboard

Afficher notamment :

```text
Campagnes actives
3

Missions terminées
128

Missions en cours
17

Budget consommé
380 000 FCFA
```

---

# 11.3 Création d'une campagne

Wizard :

### Étape 1

Type de mission.

### Étape 2

Localisation.

### Étape 3

Instructions.

### Étape 4

Questions.

### Étape 5

Preuves demandées.

### Étape 6

Nombre de missions.

### Étape 7

Budget.

### Étape 8

Paiement.

---

# 11.4 Tarification indicative

Exemple :

```text
20 missions

Prix / mission : 3 000 FCFA

Sous-total : 60 000 FCFA
```

Le calcul doit être affiché avant paiement.

---

# 11.5 Paiement entreprise

Le MVP devra permettre au minimum :

* Mobile Money ;
* paiement manuel vérifié par administration si nécessaire.

Une automatisation complète pourra venir ensuite.

---

# 11.6 Suivi de campagne

L'entreprise voit :

```text
Campagne : Vérification Produit X

████████░░ 80%

16 / 20 missions réalisées
```

---

# 11.7 Résultats

Pour chaque mission :

* contributeur anonymisé si nécessaire ;
* localisation ;
* heure ;
* réponses ;
* photos ;
* statut.

---

# 11.8 Carte des résultats

Afficher les points vérifiés.

---

# 11.9 Export

Minimum MVP :

### CSV / Excel

Phase suivante :

### PDF

---

# 12. Administration SapSap

Accessible uniquement à l'équipe interne.

Exemple :

`admin.sapsap.bf`

---

# 12.1 Dashboard administrateur

Afficher :

* utilisateurs ;
* entreprises ;
* missions ;
* campagnes ;
* volume financier ;
* commissions ;
* retraits ;
* alertes.

---

# 12.2 Gestion utilisateurs

Actions :

* consulter ;
* vérifier ;
* suspendre ;
* bannir ;
* consulter historique.

---

# 12.3 Gestion KYC

Possibilité :

* accepter ;
* refuser ;
* demander une nouvelle pièce.

---

# 12.4 Gestion entreprises

Actions :

* vérifier ;
* suspendre ;
* consulter campagnes.

---

# 12.5 Modération des campagnes

Au MVP, une campagne entreprise ne doit pas forcément être publiée immédiatement.

Statuts :

```text
Brouillon
↓
Soumise
↓
Vérification SapSap
↓
Approuvée
↓
Active
```

Objectif :

éviter les missions dangereuses ou illégales.

---

# 13. Missions interdites

SapSap doit interdire explicitement :

* installations militaires ;
* lieux de sécurité sensibles ;
* collecte de secrets ;
* surveillance de personnes ;
* photographie clandestine ;
* collecte illégale de données personnelles ;
* missions dangereuses ;
* missions illégales ;
* harcèlement ;
* intrusion sur propriété privée.

---

# 14. Validation des missions

Au lancement, une grande partie de la validation peut être humaine.

Dashboard :

```text
Mission #SS-2941

GPS : ✓
Distance : 23 m
Photos : 3
Questionnaire : complet

[ VALIDER ]
[ REJETER ]
```

---

# 15. Anti-fraude MVP

## Obligatoire

### Géolocalisation

Comparer :

```text
lieu mission
vs
GPS utilisateur
```

---

### Heure serveur

Ne jamais se fier uniquement à l'heure du téléphone.

---

### Photo directe

Prise depuis l'application.

---

### Hash des images

Détecter les images déjà utilisées.

---

### Device ID

Identifier les comportements de plusieurs comptes sur un même appareil.

---

### Historique

Un utilisateur ayant trop de rejets perd son accès.

---

# 16. Anti-fraude Phase 2

Plus tard :

* détection IA ;
* reconnaissance produit ;
* analyse métadonnées ;
* détection screenshots ;
* détection photos modifiées ;
* anomalies GPS ;
* détection comptes coordonnés ;
* scoring automatique.

---

# 17. Notifications

Le MVP doit gérer :

### Contributeur

* nouvelle mission ;
* mission bientôt expirée ;
* mission validée ;
* mission rejetée ;
* paiement reçu.

### Entreprise

* campagne approuvée ;
* première mission terminée ;
* campagne terminée.

---

# 18. Site public

Adresse :

**sapsap.bf**

Objectifs :

* expliquer le concept ;
* rassurer ;
* attirer entreprises ;
* recruter contributeurs.

---

# 18.1 Landing page

Structure proposée :

### Hero

> **Vos yeux sur le terrain.**

Besoin de vérifier un produit, un point de vente ou une expérience client ?

SapSap trouve quelqu'un à proximité.

---

### Comment ça marche ?

```text
1. Créez une mission
2. Un contributeur se déplace
3. Recevez les preuves
```

---

### Cas d'usage

Retail
Audit
Client mystère

---

### CTA

**Lancer une mission**

---

# 19. Business model

Modèle :

## Commission par mission

Exemple :

```text
Entreprise
3 000 F

        ↓

Contributeur
2 000 F

SapSap
1 000 F
```

Objectif initial :

> marge brute plateforme entre 25 et 35 %.

---

# 20. Exemple économique

Entreprise :

20 vérifications.

Prix :

3 000 F / mission.

```text
GMV
60 000 F

Contributeurs
40 000 F

SapSap brut
20 000 F
```

Avant :

* frais paiement ;
* support ;
* promotions ;
* remboursements.

---

# 21. Architecture technique proposée

## Mobile

**Angular + Ionic + Capacitor**

Cibles :

* Android ;
* iOS plus tard.

---

## Web

Possibilité :

**Angular**

ou framework web distinct suivant les besoins.

---

## Backend

Options pertinentes :

### NestJS

ou

### Laravel

Architecture API REST.

---

# 22. Services principaux

```text
SapSap
│
├── Auth Service
├── User Service
├── Mission Service
├── Campaign Service
├── Location Service
├── Media Service
├── Payment Service
├── Wallet Service
├── Notification Service
├── Fraud Service
└── Reporting Service
```

Au MVP, ils peuvent être regroupés dans un monolithe modulaire.

Pas besoin de microservices.

---

# 23. Base de données

Base relationnelle recommandée :

**PostgreSQL**

---

# 24. Entités principales

```text
users
profiles
companies
campaigns
missions
mission_assignments
mission_submissions
questions
answers
media
locations
wallets
wallet_transactions
payments
withdrawals
kyc_documents
ratings
devices
fraud_flags
notifications
audit_logs
```

---

# 25. Modèle Mission simplifié

```text
Mission
- id
- campaign_id
- title
- description
- latitude
- longitude
- radius
- reward
- deadline
- status
- required_photos
- estimated_duration
- created_at
```

---

# 26. Modèle Submission

```text
Submission
- id
- mission_id
- contributor_id
- latitude
- longitude
- distance
- submitted_at
- status
- reviewer_id
- rejection_reason
```

---

# 27. Sécurité

Minimum :

* HTTPS ;
* JWT sécurisé ;
* refresh token ;
* hash bcrypt/argon2 ;
* RBAC ;
* rate limiting ;
* logs d'audit ;
* validation des fichiers ;
* URLs médias temporaires ;
* sauvegardes ;
* secrets hors repository.

---

# 28. Protection des données

SapSap devra appliquer :

* consentement ;
* minimisation ;
* limitation de conservation ;
* contrôle des accès ;
* suppression des données ;
* chiffrement ;
* journalisation.

Les exigences réglementaires précises devront être validées avant exploitation commerciale.

---

# 29. Mode faible connexion

Très important pour SapSap.

Le mobile devra :

* compresser les photos ;
* éviter les téléchargements inutiles ;
* sauvegarder temporairement une mission ;
* reprendre un upload interrompu.

---

# 30. Hors ligne

Version MVP :

possibilité de conserver les données d'une mission en local lorsqu'une connexion disparaît pendant son exécution.

Synchronisation dès retour du réseau.

---

# 31. Langue

MVP :

### Français

Plus tard :

* Mooré ;
* Dioula ;
* éventuellement anglais.

---

# 32. KPI principaux du MVP

## Business

### Nombre d'entreprises payantes

KPI numéro 1.

---

### Repeat Purchase Rate

Pourcentage d'entreprises effectuant une deuxième campagne.

---

### GMV

Montant total des missions.

---

### Revenu SapSap

Commission nette.

---

## Marketplace

### Mission Fill Rate

Pourcentage de missions acceptées.

---

### Completion Rate

Pourcentage terminé.

Objectif :

> > 85 %.

---

### Validation Rate

Pourcentage de missions validées.

---

### Temps moyen d'exécution

Objectif à mesurer.

---

### Fraude

Pourcentage de soumissions frauduleuses.

---

# 33. Objectifs pilote

Avant lancement massif :

### Contributeurs

100 à 200 préinscriptions.

### Entreprises interrogées

20 minimum.

### Entreprises pilotes

5.

### Entreprises payantes

3 minimum.

### Missions

100 minimum.

### Repeat customers

Au moins 2 entreprises doivent recommander.

---

# 34. MVP technique

## P0 — absolument nécessaire

### Contributeur

* inscription ;
* login ;
* profil ;
* missions disponibles ;
* détail mission ;
* accepter mission ;
* GPS ;
* photos ;
* questionnaire ;
* soumission ;
* historique ;
* portefeuille.

### Business

* compte entreprise ;
* campagnes ;
* création de missions ;
* paiement ;
* suivi ;
* résultats.

### Admin

* comptes ;
* campagnes ;
* missions ;
* validations ;
* KYC ;
* retraits ;
* paiements.

---

# 35. P1 — après validation

* carte avancée ;
* notifications push avancées ;
* parrainage ;
* gamification ;
* iOS public ;
* paiement automatique ;
* exports PDF ;
* dashboard analytics ;
* missions récurrentes ;
* équipes entreprises.

---

# 36. P2 — croissance

* IA anti-fraude ;
* reconnaissance produits ;
* analyse rayons ;
* API entreprise ;
* SapSap Pro ;
* missions ONG ;
* analytics avancés ;
* Bobo-Dioulasso ;
* segmentation contributeurs ;
* abonnements Enterprise.

---

# 37. Ce qui est volontairement hors MVP

Ne pas développer immédiatement :

* réseau social ;
* chat temps réel complexe ;
* crypto ;
* système de badges complexe ;
* IA générative ;
* microservices ;
* abonnement compliqué ;
* internationalisation ;
* dizaines de catégories de missions ;
* système avancé de publicité.

---

# 38. Design UX

La priorité doit être :

> **simplicité extrême.**

Le contributeur doit pouvoir comprendre une mission en quelques secondes.

Navigation mobile proposée :

```text
Accueil
Missions
Activité
Portefeuille
Profil
```

---

# 39. UX Business

Navigation :

```text
Dashboard
Campagnes
Résultats
Facturation
Entreprise
```

CTA permanent :

> **+ Nouvelle campagne**

---

# 40. Stratégie de lancement

SapSap ne doit pas être lancé immédiatement dans les stores avec de grandes campagnes publicitaires.

Le lancement comporte trois étapes.

---

# Phase A — Validation manuelle

Durée indicative :

4 à 8 semaines.

Outils :

* landing page ;
* WhatsApp ;
* formulaires ;
* Mobile Money ;
* dashboard interne simple.

Objectif :

> vendre avant d'automatiser.

---

# Phase B — MVP fermé

Inviter :

* 100 contributeurs ;
* 5 à 10 entreprises.

Tester le parcours complet.

---

# Phase C — lancement Ouagadougou

Après validation :

* Android public ;
* communication ;
* partenariats ;
* recrutement contributeurs ;
* prospection entreprise.

---

# 41. Budget de validation

Budget recommandé :

### 300 000 à 700 000 FCFA

Il pourra financer :

* communication ;
* transport ;
* pilotes ;
* rémunérations contributeurs ;
* supports commerciaux ;
* domaine ;
* infrastructure légère.

---

# 42. Budget après validation

Pour un véritable lancement avec plusieurs mois de trésorerie :

### environ 8 à 12 millions FCFA

À préciser après les données du pilote.

---

# 43. Financement

SapSap devra idéalement chercher un investisseur après obtention de traction.

Éléments à présenter :

* entreprises clientes ;
* missions réalisées ;
* GMV ;
* repeat rate ;
* nombre d'agents ;
* marge ;
* coût acquisition ;
* temps d'exécution.

Objectif envisagé après validation :

> lever environ 8 à 12 millions FCFA.

Une dilution initiale de l'ordre de :

> **15 à 20 %**

serait préférable à une cession immédiate de 30 à 40 %, sauf apport stratégique exceptionnel.

---

# 44. Roadmap

## Étape 1 — validation

* réserver sapsap.bf ;
* identité minimale ;
* landing page ;
* étude terrain ;
* 20 entretiens B2B ;
* recruter les premiers agents.

---

## Étape 2 — pilotes

* sélectionner 3 offres ;
* exécuter les campagnes manuellement ;
* mesurer les résultats ;
* corriger le pricing.

---

## Étape 3 — conception MVP

* UX/UI ;
* architecture ;
* base de données ;
* API ;
* design system ;
* spécifications.

---

## Étape 4 — développement

### Sprint 1

Auth + utilisateurs.

### Sprint 2

Missions.

### Sprint 3

Soumissions terrain.

### Sprint 4

Business dashboard.

### Sprint 5

Admin.

### Sprint 6

Wallet + paiements.

### Sprint 7

Anti-fraude.

### Sprint 8

QA + pilote fermé.

---

# 45. Critères de réussite du MVP

SapSap sera considéré comme ayant validé son MVP si :

* au moins 5 entreprises utilisent réellement la plateforme ;
* au moins 3 entreprises paient ;
* au moins 100 missions sont réalisées ;
* le taux de réalisation dépasse 85 % ;
* le taux de fraude reste maîtrisable ;
* des missions peuvent être exécutées en quelques heures ;
* au moins 2 entreprises commandent une deuxième campagne ;
* la marge par mission est positive.

Le critère le plus important reste :

> **des entreprises doivent revenir et payer de nouveau.**

---

# 46. North Star Metric

La métrique principale de SapSap devrait devenir :

## Nombre de missions terrain validées et payées par semaine

Elle combine :

* demande B2B ;
* activité contributeurs ;
* qualité ;
* revenu.

---

# 47. Vision long terme

SapSap pourra évoluer progressivement vers :

> **l'infrastructure de collecte et d'opérations terrain à la demande au Burkina Faso.**

Puis potentiellement :

* Côte d'Ivoire ;
* Mali ;
* Niger ;
* Sénégal ;
* Togo ;
* Bénin.

SapSap pourrait disposer à terme de milliers de contributeurs vérifiés et permettre à une organisation de demander :

> « Vérifiez-moi 300 points de vente dans trois villes cette semaine. »

et recevoir rapidement des données vérifiées.

---

# 48. Résumé exécutif

**SapSap** est une marketplace de missions terrain permettant aux entreprises de faire vérifier rapidement des informations physiques par des contributeurs rémunérés.

Le MVP sera lancé uniquement à **Ouagadougou**.

Les trois premiers services seront :

1. vérification terrain ;
2. audit point de vente ;
3. client mystère.

Le produit reposera sur :

* une application mobile contributeur ;
* un dashboard web entreprise ;
* un dashboard administrateur ;
* un système de géolocalisation et de preuves ;
* un portefeuille ;
* des paiements Mobile Money ;
* un système de réputation et d'anti-fraude.

Le modèle économique sera basé principalement sur une commission prélevée sur chaque mission.

La validation commerciale précédera le développement complet afin de vérifier que des entreprises burkinabè sont réellement disposées à payer régulièrement pour le service.

## Positionnement

> **SAPSAP — Vos yeux sur le terrain.**

## Promesse

> **Besoin de vérifier quelque chose sur le terrain ? SapSap envoie quelqu'un.**

## Vision

> **Construire le réseau terrain à la demande du Burkina Faso.**
