---
name: SapSap Craft & Field Design System (Etsy DNA)
description: Système de design chaleureux, éditorial et performant pour la collecte terrain géolocalisée et les portails Web SapSap.
status: final
updated: 2026-08-28
colors:
  terracotta: '#F1641E'
  terracotta-dark: '#D34B0B'
  terracotta-light: '#FFEDE5'
  terracotta-subtle: '#FFF6F2'
  sage: '#4D6B53'
  sage-light: '#EBF2EC'
  sage-dark: '#2F4735'
  buttercream: '#FDF0CD'
  buttercream-dark: '#B88219'
  lilac: '#E8E9FF'
  lilac-text: '#484C8A'
  canvas: '#FAF8F5'
  surface: '#FFFFFF'
  surface-elevated: '#F5F1EB'
  surface-border: '#E8E2D9'
  surface-border-subtle: '#F0ECE4'
  ink: '#222222'
  ink-muted: '#595959'
  ink-subtle: '#757575'
typography:
  display-lg:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Fraunces
    fontSize: 22px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Fraunces
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14.5px
    fontWeight: '400'
    lineHeight: '1.5'
  price-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '800'
    lineHeight: '1.1'
  label-pill:
    fontFamily: Plus Jakarta Sans
    fontSize: 12.5px
    fontWeight: '600'
    lineHeight: '1.2'
  code-mono:
    fontFamily: JetBrains Mono
    fontSize: 11.5px
    fontWeight: '500'
rounded:
  sm: 8px
  md: 14px
  lg: 20px
  xl: 28px
  full: 9999px
spacing:
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  card-gap: 22px
components:
  mission-card:
    background: '{colors.surface}'
    border: '1px solid {colors.surface-border}'
    radius: '{rounded.lg}'
    shadow: '0 8px 24px rgba(80, 50, 20, 0.06)'
  button-primary:
    background: '{colors.terracotta}'
    color: '#FFFFFF'
    radius: '{rounded.full}'
    shadow: '0 8px 20px rgba(241, 100, 30, 0.25)'
  pill-filter:
    background: '{colors.surface}'
    color: '{colors.ink}'
    radius: '{rounded.full}'
    border: '1px solid {colors.surface-border}'
  badge-urgent:
    background: '{colors.buttercream}'
    color: '{colors.buttercream-dark}'
    radius: '{rounded.full}'
  badge-verified:
    background: '{colors.sage-light}'
    color: '{colors.sage-dark}'
    radius: '{rounded.sm}'
---

# SapSap — Design System & Visual Specification (Etsy DNA)

→ Référence visuelle et interactive : [`mockups/prototype-etsy-sapsap.html`](file:///c:/Users/Ben%20Cherif/Desktop/projet/SapSap/_bmad-output/planning-artifacts/ux-designs/ux-SapSap-2026-08-28/mockups/prototype-etsy-sapsap.html).

## 1. Brand & Style

Le système de design de **SapSap** fusionne l'ambiance artisanale, chaleureuse et éditoriale d'**Etsy** avec la rigueur technologique d'une plateforme de collecte terrain géolocalisée en Afrique de l'Ouest.

Là où les applications d'audit de données classiques sont souvent froides, grises et purement utilitaires, SapSap célèbre le travail de terrain des contributeurs et l'énergie des commerces locaux. Chaque écran dégage une sensation tactile, accueillante et premium grâce à des fonds écru naturels (`{colors.canvas}`), des touches terracotta lumineuses (`{colors.terracotta}`) et une typographie avec empattements expressive (`{typography.display-lg}`).

La marque s'incarne sous trois principes cardinaux :
1. **La Chaleur de l'Artisanat (Craft)** : Des fonds organiques chauds et des tons doux qui valorisent chaque mission comme une opportunité gratifiante.
2. **La Clarté sans Friction** : Des montants en FCFA immédiatement lisibles, des pastilles de filtres arrondies tactiles et des actions directes à un clic.
3. **La Vitesse Haute Performance** : Des transitions douces à courbe cubique fluide et une densité d'information optimisée sur le desk d'administration.

---

## 2. Colors

La palette chromatique est directement inspirée de la chaleur naturelle des marchés et paysages ivoiriens, harmonisée avec la sophistication d'Etsy :

* **Terracotta Signature (`{colors.terracotta}` #F1641E)** : La couleur primaire de la marque. Utilisée pour les appels à l'action principaux, les boutons de réservation, les montants récompensés et le logo.
* **Canvas Écru & Surfaces Douces (`{colors.canvas}` #FAF8F5, `{colors.surface}` #FFFFFF, `{colors.surface-elevated}` #F5F1EB)** : Remplace le blanc clinique classique par un fond écru chaleureux reposant pour les yeux.
* **Sauge Végétal (`{colors.sage}` #4D6B53 & `{colors.sage-light}` #EBF2EC)** : Utilisé pour certifier la géolocalisation GPS vérifiée, le score de réputation et les approbations administratives.
* **Jaune Beurre & Ocre (`{colors.buttercream}` #FDF0CD & `{colors.buttercream-dark}` #B88219)** : Utilisé pour les primes d'urgence, le décompte d'auto-validation à 48h et les alertes bienveillantes.
* **Lilas Pastel (`{colors.lilac}` #E8E9FF & `{colors.lilac-text}` #484C8A)** : Utilisé pour les tags neutres, les micro-sondages et les messages d'aide.
* **Deep Ink (`{colors.ink}` #222222)** : Un noir charbon profond et adouci, offrant un contraste parfait (AAA) sans l'agressivité du noir pur.

---

## 3. Typography

Le système typographique repose sur une alliance harmonieuse entre une police *Serif* éditoriale et une police *Sans-Serif* géométrique moderne :

* **Titres & Identité Émotionnelle (`Fraunces`)** :
  * Apporte du caractère, de la chaleur et une signature éditoriale.
  * Utilisé sur les en-têtes majeurs (`{typography.display-lg}` 32px), les titres de section (`{typography.headline-md}` 22px) et les titres de missions.
* **Interface, Données & Navigation (`Plus Jakarta Sans`)** :
  * Assure une lisibilité parfaite des montants en FCFA (`{typography.price-hero}`), des coordonnées GPS, des descriptions d'adresses et des boutons.
* **Données Techniques & Anti-Fraude (`JetBrains Mono`)** :
  * Utilisé exclusivement pour les Device IDs SHA-256, les coordonnées de latitude/longitude précises et les codes de transaction séquestre.

---

## 4. Layout & Spacing

* **Grille Marketplace Mosaïque** : Grille adaptative en colonnes avec un espacement régulier de `{spacing.card-gap}` (22px).
* **Alignement Découverte & Portails** : Largeur maximale contrainte à `1360px` centrée avec un padding latéral de `{spacing.margin-desktop}` (32px) sur ordinateur et `{spacing.margin-mobile}` (16px) sur mobile.
* **Sidebar Sticky Espace Entreprise** : Disposition à 2 colonnes (2/3 formulaire interactif, 1/3 résumé budgétaire et aperçu direct de la carte).
* **Desk de Modération en Double Écran (Split-Screen)** : Comparaison symétrique 50/50 entre la photo de consigne attendue et la photo GPS soumise par le contributeur.

---

## 5. Elevation & Depth

* **Élévations Tonalisées et Diffusées** :
  * Pas d'ombres noires dures. Les ombres intègrent une légère nuance chaude : `rgba(80, 50, 20, 0.06)`.
  * **Hover Lift** : Survol des cartes avec translation de `-4px` et halo terracotta subtil.
* **Bordures Fantômes (Ghost Borders)** : Les conteneurs utilisent une bordure fine de 1px en `{colors.surface-border}` (#E8E2D9) pour délimiter les blocs sans saturer la vision.

---

## 6. Shapes

* **Courbures Organiques Douces** :
  * **Pills & Filtres (`{rounded.full}` 9999px)** : Pour tous les filtres de catégories, les boutons d'action d'en-tête et les badges de recherche.
  * **Cartes & Conteneurs (`{rounded.lg}` 20px & `{rounded.xl}` 28px)** : Donne un aspect tactile et rassurant aux missions et blocs de tableaux de bord.
  * **Badges Métriques (`{rounded.sm}` 8px)** : Pour les micro-tags de géolocalisation et les indicateurs techniques.

---

## 7. Components

### A. Carte Mission Mosaïque (Mosaic Card)
* **Visuel supérieur (180px)** : Découpage en mosaïque de 4 quadrants d'images représentatives du produit ou de l'enseigne auditée.
* **Floating Heart Badge** : Bouton favori circulaire blanc flottant en haut à droite avec micro-animation au clic.
* **Urgency Badge** : Pastille jaune beurre en haut à gauche pour les missions sous compte à rebours 48h.
* **Corps de carte** : Nom de la marque cliente, titre en `Fraunces`, tags géographiques (ex: `📍 Cocody 350m`), prix en FCFA bien visible et bouton d'action directe « Réserver ».

### B. Wizard de Création de Campagne (Business Portal)
* Barre d'étape progressive avec pastilles numérotées et validation automatique d'étape.
* Cartes d'options radio sélectionnables avec mise en valeur terracotta.
* Calculateur dynamique de séquestre en temps réel avec commission SapSap (15%) intégrée.

### C. Desk de Modération Rapide (Admin Portal)
* Split-screen d'inspection photo haute résolution.
* Badge GPS incrusté sur la photo avec horodatage et distance au POI.
* Raccourcis clavier véloces : `[E]` Valider & Payer, `[R]` Rejeter avec motif, `[F]` Signaler Fraude.

---

## 8. Do's and Don'ts

| À Faire (Do) | À Éviter (Don't) |
|---|---|
| Utiliser le fond écru `{colors.canvas}` (#FAF8F5) pour toutes les pages. | Utiliser un fond blanc pur clinique (#FFFFFF) sur toute la page. |
| Mettre en valeur les montants avec `{colors.terracotta}` et le suffixe FCFA. | Utiliser des symboles de devises génériques sans mentionner le FCFA. |
| Utiliser la typographie *Serif* `Fraunces` pour les titres et collections. | Utiliser `Fraunces` sur des petits labels techniques ou des tableaux denses. |
| Arrondir généreusement les boutons d'action et les filtres (`{rounded.full}`). | Utiliser des boutons carrés avec des angles agressifs à 0px. |
| Utiliser des ombres douces teintées de sépia léger. | Utiliser des ombres noires dures (`rgba(0,0,0,0.5)`). |
