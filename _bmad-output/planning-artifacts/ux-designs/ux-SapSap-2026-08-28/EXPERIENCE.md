---
name: SapSap Experience Specification
status: final
sources:
  - _bmad-output/planning-artifacts/epics.md
  - cahier-de-charge.md
updated: 2026-08-28
---

# SapSap — Experience Specification (Etsy DNA)

→ Référence de maquette interactive : [`mockups/prototype-etsy-sapsap.html`](file:///c:/Users/Ben%20Cherif/Desktop/projet/SapSap/_bmad-output/planning-artifacts/ux-designs/ux-SapSap-2026-08-28/mockups/prototype-etsy-sapsap.html).  
→ Référence des jetons visuels : [`DESIGN.md`](file:///c:/Users/Ben%20Cherif/Desktop/projet/SapSap/_bmad-output/planning-artifacts/ux-designs/ux-SapSap-2026-08-28/DESIGN.md).

---

## 1. Foundation

SapSap fonctionne en écosystème multi-surfaces unifié :
1. **Portail Web Business (Entreprises & Marques)** : Interface de création, suivi cartographique et export des données de campagnes terrain.
2. **Portail Web Admin (Modération & Sécurité)** : Console haute cadence pour la vérification anti-fraude, la modération des preuves photos et la gestion financière des séquestres.
3. **Application & Web Découverte (Contributeurs)** : Expérience fluide optimisée pour mobile et desktop, permettant de chercher, réserver et compléter des missions rémunérées en FCFA.

Le design system défini dans `DESIGN.md` régit l'ensemble des éléments visuels en appliquant l'ADN chaleureux d'Etsy (fonds écru `{colors.canvas}`, accents terracotta `{colors.terracotta}`, typographie éditoriale `{typography.display-lg}`).

---

## 2. Information Architecture

| Surface | Origine / Accès | Rôle & Contenu Clé |
|---|---|---|
| **Explorer & Découverte** | Page d'accueil / Navigation haute | Recherche plein-texte, pills de catégories, cartes missions mosaïques, filtres de proximité GPS. |
| **Détail Mission & Réservation** | Clic sur une carte mission | Consignes détaillées, photos exemples, rémunération FCFA, bouton de réservation (verrou 2h). |
| **Créateur de Campagne (Business)** | Onglet Espace Entreprise | Wizard en 4 étapes : Type d'audit, Périmètre & POI, Consignes photo, Calculateur de budget séquestre. |
| **Dashboard Campagne & Carte (Business)** | Espace Entreprise > Campagnes | Carte interactive des points relevés, taux de complétion, graphiques d'évolution et export CSV/Excel. |
| **Desk de Modération (Admin)** | Espace Modération Admin | Split-screen de comparaison photo (Consigne vs Preuve), coordonnées GPS, décompte 48h, actions rapides `[E]`/`[R]`. |
| **Portefeuille & Retraits** | Clic sur le solde utilisateur | Historique des gains, solde disponible, formulaire de retrait Mobile Money (Wave, Orange, MTN). |
| **Messagerie & Support** | Icône Messages | Chat contextuel lié à une mission pour clarifier une photo ou une consigne. |

---

## 3. Voice and Tone (Microcopie)

La voix de SapSap est **bienveillante, claire, encourageante et transparente**. Elle évite le jargon technique froid au profit d'un ton chaleureux et humain.

| Situation | À Dire (Do) | À Éviter (Don't) |
|---|---|---|
| **Mission réservée** | « Superbe ! Cette mission est réservée pour vous pendant 2 heures. » | « Entrée #304 verrouillée en base. » |
| **Preuve envoyée** | « Preuve reçue avec succès ! Validation garantie sous 48h max. » | « Envoi réussi. Statut: PENDING. » |
| **Auto-validation 48h** | « Délai de revue dépassé : vos 1 500 FCFA ont été crédités automatiquement ! » | « Job scheduler cron executed. » |
| **Erreur de proximité GPS** | « Vous êtes à 350m du magasin. Rapprochez-vous à moins de 50m pour soumettre la photo. » | « DistanceOutOfRange: 350 > 50. » |
| **Calculateur de budget** | « Rémunération des contributeurs + 15% de frais SapSap = Total garanti en séquestre. » | « Subtotal + platform markup formula. » |

---

## 4. Component Patterns

### A. Cartes Missions Mosaïques (Mosaic Cards)
* **Comportement au survol** : Élévation douce de `-4px` avec affichage immédiat de l'action rapide.
* **Bouton Favori (Floating Heart)** : Clic instantané sans rechargement, pulsation terracotta et notification toast.
* **Badge d'Urgence 48h** : Animation d'apparition discrète lorsque la mission a moins de 48 heures de validité.

### B. Wizard de Création de Campagne
* Calculateur budgétaire interactif : à chaque modification du curseur de points de vente ou du montant unitaire, le total du séquestre et l'aperçu de la carte se mettent à jour en temps réel sans latence.
* Verrouillage du formulaire tant que le budget séquestre n'est pas simulé et approvisionné.

### C. Desk de Modération Rapide (Split-Screen Desk)
* **Comparaison visuelle côte-à-côte** : Photo de référence fournie par l'entreprise à gauche, photo prise par le contributeur à droite avec loupe de zoom synchronisée.
* **Incrustation du tampon GPS** : Affiche les coordonnées, la distance calculée au point d'intérêt et l'empreinte SHA-256 du périphérique.
* **Raccourcis clavier** : La touche `[E]` valide et débloque le paiement, `[R]` ouvre le modal de motif de rejet, `[F]` signale la soumission à la cellule anti-fraude.

---

## 5. State Patterns

| État | Surface | Traitement UX |
|---|---|---|
| **Chargement initial** | Grille de missions | Squelettes de cartes (skeletons) aux couleurs écru douces avec reflet shimmer. |
| **Aucun résultat de recherche** | Explorer | Illustration chaleureuse : *« Aucune mission trouvée pour ce quartier. Élargissez vos filtres ou activez la notification ! »* |
| **Hors zone GPS (> 50m)** | Écran de capture photo | Radar visuel indiquant la distance restante avec bouton de guidage vers le point de vente. |
| **Validation automatique (48h)** | Desk admin & Dashboard contributeur | Barre de progression circulaire décomptant les heures restantes avant validation automatique. |
| **Solde insuffisant pour retrait** | Portefeuille | Message explicatif clair : *« Le montant minimum de retrait est de 1 000 FCFA. Encore 250 FCFA pour débloquer votre retrait ! »* |

---

## 6. Interaction Primitives

* **Réservation en 1 clic** : Réserve immédiatement la mission sur le compte du contributeur pour éviter les doublons sur le terrain.
* **Prise de vue intégrée** : Blocage de l'import depuis la galerie pour les missions requérant une preuve photo en direct avec métadonnées EXIF/GPS certifiées.
* **Retraits instantanés** : Sélection du fournisseur Mobile Money (Orange, MTN, Wave, Moov) avec confirmation SMS immédiate.

---

## 7. Accessibility Floor

* **Contraste Chromatique** : Tous les textes en `{colors.ink}` sur fond `{colors.canvas}` respectent un ratio de contraste supérieur à `7:1` (conformité WCAG AAA).
* **Zones tactiles (Tap Targets)** : Tous les boutons, filtres et pastilles d'action ont une hauteur minimale de `44px` sur mobile.
* **Navigation Clavier Complète** : Tout le desk de modération et le wizard de création de campagne sont entièrement pilotables sans souris via tabulation et raccourcis dédiés.

---

## 8. Inspiration & Anti-patterns

* **Inspiré d'Etsy** : La mise en valeur des missions sous forme de mosaïques soignées, les pastilles de filtres arrondies douces, le dialogue direct entre créateurs de campagnes et contributeurs.
* **Rejeté — Les tableaux austères type tableur** : Les contributeurs ne doivent pas avoir l'impression de remplir des formulaires administratifs, mais de participer à une dynamique valorisante.
* **Rejeté — Le chronomètre anxiogène agressif** : Le délai de 2h de réservation est présenté comme une sécurité protectrice pour le contributeur, sans compte à rebours rouge clignotant.

---

## 9. Key Flows

### Parcours 1 : Découverte et réservation d'une mission terrain
**Protagoniste** : *Aïcha, 22 ans, étudiante à Abidjan (Cocody).*

1. Aïcha ouvre SapSap sur son smartphone en sortant de cours.
2. La page d'accueil affiche les missions à proximité immédiate grâce à la pastille « 📍 À moins de 500m ».
3. Elle repère la mission *« Relevé Prix Huile Dinor 1L »* rémunérée **1 500 FCFA** au Carrefour Market de Cocody St Jean.
4. Elle clique sur la carte mosaïque et examine la photo de référence.
5. Elle clique sur **« Réserver »** : la mission lui est allouée en exclusivité pour 2 heures.
6. **Climax** : Arrivée au magasin, elle prend la photo de l'étiquette. L'indicateur GPS passe au vert (*« 14m du rayon — Validé »*). Elle valide l'envoi et reçoit le message confirmant la garantie de paiement sous 48h.

---

### Parcours 2 : Lancement d'une campagne de relevé par une marque
**Protagoniste** : *Jean-Marc, Brand Manager chez SIFCA.*

1. Jean-Marc se connecte sur le Portail Business SapSap.
2. Il clique sur **« + Créer une campagne »** et sélectionne le type *« Relevé de Prix & Promo »*.
3. Il choisit la zone *« Abidjan (Toutes communes) »* et règle le curseur sur *50 points de vente*.
4. Il fixe la rémunération à *1 500 FCFA* par point audité.
5. Le calculateur affiche en direct : *75 000 FCFA (Contributeurs) + 11 250 FCFA (Frais 15%) = 86 250 FCFA Total*.
6. **Climax** : Il valide le séquestre via Wave Business. La campagne est instantanément publiée sur le marketplace et les premières photos arrivent en moins de 3 heures.

---

### Parcours 3 : Modération rapide par l'administrateur
**Protagoniste** : *Moussa, Administrateur SapSap.*

1. Moussa ouvre son desk de modération le matin.
2. L'interface lui présente 18 soumissions en attente avec le temps restant avant auto-validation 48h.
3. Pour la soumission d'Aïcha, l'écran scindé affiche la consigne à gauche et la photo nette à droite.
4. Le contrôle anti-fraude confirme : *GPS à 14m, Device SHA-256 certifié*.
5. **Climax** : Moussa appuie sur la touche clavier **`[E]`**. La soumission est validée en une demi-seconde et le portefeuille d'Aïcha est instantanément crédité de 1 500 FCFA.
