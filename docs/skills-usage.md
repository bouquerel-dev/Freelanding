# Outil de chiffrage `/estimation`, 2026-11-12

Nouvelle page publique, téléphone d'abord. Captures de chaque étape dans le
rapport de session (00 avant : la route n'existait pas, 404 ; 01 à 07 première
et deuxième passe ; 08 et 09 état final).

Direction posée avant le code : une conversation avec Eliott, pas un
formulaire. Scène : un dirigeant de TPE, sur son téléphone entre deux
rendez-vous, veut savoir s'il est à 3 000 ou à 30 000 € avant d'appeler.
Le site est déjà sombre, Geist, angles droits, accent volt : on garde
l'identité, la seule prise de risque est sur les chiffres du résultat.

## impeccable (registre marque, `brand.md` et `shape.md` lus en entier)

- Stratégie de couleur « Committed » sur le seul résultat : l'abonnement, offre
  qu'Eliott pousse, est un aplat volt plein ; l'achat direct reste sur la
  surface sombre. Partout ailleurs, accent sous 10 %.
- Typographie : les fourchettes sont l'élément-star, en Geist Black énorme
  (`clamp(44px, 13vw, 64px)`). Passe `typeset` sur la capture 04 : « 8000 à
  16000 € HT » débordait et perdait ses séparateurs de milliers (l'espace fine
  disparaît dans l'approche serrée). Correction : fourchette empilée sur deux
  lignes « de / à », espace insécable ordinaire, unité sous le chiffre (07).
- Passe `layout` sur la capture 02 : « MODIFIER » en capitales sous chaque
  réponse faisait de l'échafaudage répété (interdit `brand.md`). Devenu un lien
  discret en casse normale à gauche de la bulle ; compteur de caractères qui
  passait sur deux lignes mis en `nowrap` ; bouton « Continuer » qui prenait
  toute la largeur ramené à sa taille.
- Passe `clarify` sur la capture 05 : l'abonnement montrait la mensualité avant
  la mise en route. Réordonné dans l'ordre où le client paie : à la commande,
  puis chaque mois pendant 12 ou 24 mois, puis le suivi seul.
- Formulaire : prénom et nom côte à côte dès le téléphone (06), case de
  consentement avec une vraie coche dessinée (elle n'était qu'un carré plein).
- Défaut trouvé sur le rendu réel (08) : rendu serveur, la première question
  restait en opacité 0 jusqu'à l'hydratation, page vide plusieurs secondes.
  Ce qui est rendu au premier passage n'est plus animé.

## emil-design-eng

- Entrée des lignes de conversation : 380 ms → 260 ms, courbe ease-out forte
  `cubic-bezier(0.23, 1, 0.32, 1)`, `transform` complet plutôt que `y` (reste
  sur le GPU). Mouvement réduit : fondu seul, plus de déplacement.
- Changement 12 / 24 mois : le chiffre se transforme (fondu court avec flou de
  3 px, 200 ms) au lieu d'être remplacé sec.
- Boutons : `scale(0.98)` à l'appui, survol limité aux pointeurs fins
  (variante `hover` de Tailwind 4).

## taste-skill

- État d'attente : la forme des deux panneaux se dessine pendant le calcul
  (jusqu'à une dizaine de secondes avec l'IA) au lieu d'une roue.
- Hiérarchie par opacité : 100 % question, 70 % libellés, 45 à 60 % aides.
- Libellé au-dessus du champ, erreur reliée au champ (`aria-invalid`).
- Aucun emoji, aucun dégradé, aucune lueur ; le seul symbole est la flèche du
  bouton de rendez-vous.

## design-council (palier complet, trois lentilles aveugles, puis reprise)

Premier passage sur les captures 06 à 09 : perception 19/30, craft FAIL,
accessibilité 9 violations AA dont 2 bloquantes. Repris (captures 10 à 13) :

- perception : bouton de rendez-vous remonté sous l'intro du résultat (il
  arrivait après deux écrans, dans le vert de l'abonnement) et répété en bas en
  contour ; « sans avance de trésorerie » démenti par la mise en route,
  remplacé ; chapeau qui annonce les coordonnées ; case de consentement
  remplacée par une mention sous le bouton ; une preuve réelle (Würth) au moment
  où l'on demande le contact ; un seul avertissement.
- craft : défilement vers l'étape active et vers les prix (il allait au bas de
  page), erreurs serveur jamais perdues, plus de flou animé, échelle du site,
  capitales réservées aux deux titres et au bouton, numéros décoratifs retirés.
- accessibilité : région d'alerte toujours montée et reliée au champ fautif,
  consignes visibles (20 caractères, champs obligatoires), plus de focus volé au
  chargement, bascule 12/24 mois en boutons `aria-pressed`, statut « Calcul en
  cours » annoncé, contrastes des bordures et du texte d'exemple relevés.
- Refusé : téléphone facultatif (Eliott prospecte par téléphone et SMS).

# Un seul lien de rendez-vous, formulaire en un écran, 2026-11-12

Pages `/rdv` (premier rendez-vous) et `/rdv/client` (clients en cours), même
composant `ReservationRendezVous`. Captures mobiles dans
`docs/captures/rdv-unique/` : `avant-*` (production avant), `apres-*`.

- **impeccable** (critique, charge cognitive; détecteur déterministe sur le
  composant et les deux pages : 0 défaut). Constats sur les captures, tous
  corrigés : (1) le message d'erreur d'un refus (sujet ou heure oubliés, numéro
  faux) tombait sous la mention légale, loin du bouton touché : il est placé
  au-dessus du bouton, et un sujet oublié ramène le visiteur sur les boutons de
  sujet ; (2) le chapeau répétait la liste des garanties : réduit à une phrase ;
  (3) le pied de page gardait son grand titre d'appel sans formulaire dessous :
  masqué sur `/rdv` et `/rdv/client` (`Footer sansFormulaire`) ; (4) le
  formulaire passe de six écrans et dix questions à un écran, quatre champs
  (sujet par boutons de 52 px, créneau, nom, e-mail, téléphone, une ligne libre
  facultative) : réponses de cadrage retirées, pas masquées. Le critique a été
  mené en une seule passe par l'agent principal (pas de sous-agent isolé).
  Non fait : design-council complet (5 lentilles), la page reprend les composants
  existants du site sans nouveau motif visuel.

# Questionnaire de cadrage avant le créneau, 2026-11-10

Prise de rendez-vous des prospects (`/rdv`, `/rdv/logiciel`) : sujet →
entreprise → besoin → projet → coordonnées (téléphone obligatoire) → créneau.
Captures mobiles dans `docs/captures/rdv-questionnaire/` (`0-avant` : créneau
d'emblée ; les autres : nouveau parcours).

- **impeccable** (critique, charge cognitive) : détecteur déterministe propre
  sur le composant. La checklist de charge cognitive a fait échouer « une étape,
  six questions » : le cadrage est découpé en trois écrans de trois à quatre
  questions. Libellés de taille raccourcis (« 2 à 5 ») pour tenir sur une ligne.
  Progression : numéros seuls sous 810 px, titres lus au lecteur d'écran.
- **design-council** (craft + anti-slop, perception, accessibilité, lentilles
  aveugles) : L1/L2 PASS ; L3 21/30, retenu : récapitulatif sur une ligne,
  intro qui compte les questions et dit à quoi servent les réponses ; écarté
  (décision d'Eliott : le questionnaire filtre) : budget, coût et décideur
  facultatifs. L5 : bordure des champs passée à 3,9:1 (bloquant), libellé sans
  aide ni erreur imbriquées, « Continuer » en `submit` pour la touche Entrée,
  annonce du bouton de confirmation au lecteur d'écran.

# Formulaire de contact en néomorphisme, 2026-11-02

Maquette validée par Eliott (HTML autonome et sept captures), portée dans le
vrai pied de page : `FooterContact.tsx` (carte et interrupteur),
`FooterContactForm.tsx` (étapes, pastilles, champs, boutons), classes `.neo-*`
de `globals.css`. Envoi inchangé : mêmes `name`, mêmes valeurs, même
`useEnvoiFormulaire`, même protection.

Captures dans `docs/captures/formulaire-neomorphisme/` : `avant-*` (formulaire
à listes) et `apres-*` (néomorphisme), à 1440 et 390, une par étape (projet,
choix au clavier, budget, coordonnées avec adresse refusée, onglet appel).

| Règle appliquée | Constat sur le rendu | Ce qui a changé |
| --- | --- | --- |
| impeccable · polish (aligner sur le système) | DESIGN.md pose des angles droits ; la maquette validée arrondit (28 / 16 px, pilules) | La maquette gagne, décision d'Eliott ; les arrondis restent cantonnés aux classes `.neo-*` du pied de page |
| impeccable · polish (contraste des états) | Le filet `#5f5f5f` de la maquette tient 2,9:1 sur `#131313`, sous les 3:1 | Contour à 40 % de blanc (3,8:1, décision de la PR 57 gardée), survol à 60 % ; point des pastilles à 40 % aussi |
| impeccable · polish (focus) | Le radio caché portait l'anneau, invisible | L'anneau double de `focus.css` passe sur la pastille, sans transition ; `--focus-shadow-keep` garde relief et creux sous l'anneau |
| impeccable · adapt | Les tuiles du type de projet suivaient la fenêtre ; la colonne du pied change d'un palier à l'autre | Requêtes de conteneur sur la carte : trois tuiles hautes au-delà de 520 px de carte, des lignes en dessous ; « Réserver un appel » à 12 px sous 340 px, une seule ligne à 390 |
| emil · press feedback | Les boutons et pastilles ne répondaient pas à l'appui | `scale(0.97)` et ombre rentrée au clic (140 ms), pastille `scale(0.98)` |
| emil · une forme qui glisse | Interrupteur | Une pastille volt déplacée en `transform` 260 ms `cubic-bezier(0.23, 1, 0.32, 1)` dans un creux |
| emil · survol | Survol déclenché au toucher sur téléphone | Relief de survol sous `@media (hover: hover) and (pointer: fine)` |
| emil · mouvement réduit | Glissés et pistes animées | Transitions de mouvement et `scale` coupées, étapes en simple fondu |
| taste · formulaires (libellé au-dessus, erreur dessous) | L'adresse fausse n'était signalée qu'à l'envoi | Vérifiée à la sortie du champ : contour rouge et aide en mots sous le champ, contour vert quand elle est juste, le rouge part à la frappe dès qu'elle est corrigée |
| taste · retour tactile | Étapes qui apparaissaient d'un coup | Arrivée en fondu glissé de 8 px, 240 ms |

## Ce qui n'a pas été repris de la maquette

- L'en-tête « Contact / Montrez-moi ce qui bloque » de la carte : le pied de
  page porte déjà son grand titre juste au-dessus.
- L'écran « C'est reçu » : l'état d'envoi reste `MessageEtat`, branché sur
  `useEnvoiFormulaire`, que la demande interdisait de toucher.
- Le panneau « Réserver un appel » garde son dessin : il vit dans
  `src/components/rendez-vous/`, travaillé sur une autre branche.

# Rythme des animations au défilement, 2026-11-02 (reprise)

Retour d'Eliott : certaines animations finissaient trop tard, presque en haut
de l'écran, et la fenêtre « temps gagné » sautait de 0 aux heures rendues.

- Un seul réglage pour tout : départ dès que l'élément paraît en bas de
  l'écran, arrivée quand il a remonté les deux tiers de l'écran (mesuré sur le
  haut de l'élément, `useProgressionDefilement`, et `cover 55%` pour les lignes
  du bon remède en CSS).
- La fenêtre « temps gagné » suit le même pas que la semaine : la pastille des
  onglets glisse, les heures de saisie fondent (11 h vers 2 h 12) et les heures
  rendues montent minute par minute (0 min vers 8 h 48), l'aplat volt et la
  phrase du bas se remplissent avec elles. Les lecteurs d'écran lisent les
  valeurs de l'onglet en texte masqué, jamais un chiffre qui défile.
- emil-design-eng : toujours `transform` et `opacity`, plus la couleur de
  l'aplat par `color-mix`, sur une seule boîte. impeccable : mouvement réduit
  inchangé, état final immédiat.
- Planches avant/après : `docs/captures/2026-11-02-rythme/`.

# Animations au défilement de l'accueil, 2026-11-02

Demande d'Eliott : animer au scroll « le temps gagné » et les sections du
même genre ; il a retenu « le bon remède », « l'IA fait le sale boulot » et
« les chiffres ». Travail visuel fait par l'agent principal. Séquences de
défilement avant (site en ligne) et après (local), 16 images par section, et
planches avant/après : `docs/captures/2026-11-02-defilement/`.

## emil-design-eng

- Cadre de décision : animation rare (une visite), but « explication » (montrer
  le temps rendu jour par jour), donc permise et plus longue qu'une interface.
- « Only animate transform and opacity » : le volt monte en `scaleY`, les
  lignes glissent en `translateX`, le filet se trace en `scaleX`. Aucune
  hauteur ni largeur animée.
- Courbe : aucune. Le défilement mène, la correspondance est linéaire, comme
  le veut aussi `scroll-choreography.md` de Hallmark.

## impeccable (`animate.md`, registre marque)

- Un moment signature : la semaine qui se convertit. Les trois autres sections
  reprennent la même famille (le pouce fait avancer), sans nouvel effet.
- `prefers-reduced-motion` : état final immédiat (compteurs à leur valeur,
  semaine qui bascule une fois à mi-écran comme avant), et la préférence est
  suivie si elle change en cours de visite.
- Rien de bloqué : un clic sur un onglet de la démo rend la main au visiteur.

## taste-skill

- Intensité de mouvement visée 6 : effets liés au scroll, sans détournement du
  défilement ni section épinglée. Le texte courant ne bouge jamais.
- Compteurs en chiffres tabulaires, pour que la largeur ne saute pas.

## Hallmark (`scroll-choreography.md`)

- État final par défaut : sans JavaScript, sans `animation-timeline` ou en
  mouvement réduit, tout est posé. Les lignes du « bon remède » passent par
  `animation-timeline: view()` sous `@supports`.
- Écart assumé : Hallmark veut un seul motif de défilement par page. Eliott en
  a demandé quatre sections ; elles partagent une seule famille.

# Test du skill Hallmark sur l'accueil, 2026-11-02

Demande d'Eliott : installer `nutlope/hallmark` et le tester sur le site. Verbe
utilisé : `audit` (Hallmark ne retouche un site existant que nommé), puis un
passage `polish` limité aux défauts francs. Rendu réel enregistré par
`sloplint --render --before` puis `--kept` (84/84 liens, 13/13 champs, 81/81
gestionnaires conservés). Captures : `docs/captures/2026-11-02-hallmark/`.

Retenu (défauts mesurés) :
- Contour des champs du formulaire de contact à 2,1:1 sur le fond, sous le
  3:1 des composants d'interface (impeccable, `color-and-contrast.md`) :
  25 % de blanc porté à 40 %, survol à 60 %. Environ 3,8:1.
- Étiquettes de la démonstration « semaine de bureau » à 10 px : 11 px, et
  césure française sur mobile, où « Commandes » sortait de sa colonne.
- Interrupteur du bandeau cookies animé sur `left` : animé en `transform`
  (emil-design-eng, « Only animate transform and opacity »).
- Héros d'article en `90vh` : `90svh`, pour ne plus passer sous la barre
  d'adresse sur téléphone.

Écarté, avec la raison :
- Règles maison de Hallmark (libellés en capitales espacées, sur-titres,
  flèche collée au lien, 80 mots par écran, titres en capitales serrés) :
  elles contredisent la direction voulue de `DESIGN.md`. Les appliquer serait
  une refonte, pas un audit.
- Faux positifs du linter : SVG de la marque (déjà `aria-hidden` par
  décomposition), vidéo du héros (décor, l'image fait le LCP), deux `sticky`
  (cartes empilées voulues), « mur de photos » (cartes empilées floutées dans
  la capture pleine page), bandeau défilant (absent de l'accueil).

# Usage des skills design — passage à une seule offre, 2026-10-31

Demande d'Eliott : le site vend à 100 % le logiciel métier ; hub et pages par métier.
Travail visuel public fait par l'agent principal ; seuls la relève de matière métier,
le relevé Search Console et Semrush et la mise à jour des tests ont été délégués.

Captures, 1440 × 900 et 390 × 844, bandeau cookies fermé, pli et pleine hauteur :

- `docs/captures/2026-10-31/avant/` : treize pages en ligne avant le changement.
- `docs/captures/2026-10-31/apres/` : les mêmes écrans, plus le hub et les trois pages.
- `docs/visuels-metiers/` : les sources SVG.

## impeccable

Références lues : `SKILL.md`, `brand.md`, `critique.md`, début de `layout.md` et de
`polish.md`. Registre : brand. Contexte : `PRODUCT.md` du dossier principal, périmé
(il décrit encore la reconstruction du gabarit) ; `DESIGN.md` annonce un accent
`#ff4500` alors que `globals.css` porte `#c8f24a`, seule valeur retenue.

Écart assumé : la critique demande deux évaluations isolées par sous-agents et une
question à Eliott. Elle a été faite sur le rendu réel par l'agent principal, seul,
pour ne pas multiplier les contextes ; `visiteurs` fait ensuite un jugement extérieur.

| Sous-commande | Constat sur le rendu capturé | Ce qui a changé |
| --- | --- | --- |
| critique | Héros : le numéro « 01 » et la colonne de porte n'ont plus de sens avec une seule offre. | Numéro retiré, titre élargi de 80 à 108 px : la phrase unique prend le poids des deux portes. |
| critique | Page métier : le carré volt du dessin tombait sous le H1. | Sujet des trois SVG déplacé à gauche, au-dessus du chapô : le titre reste net. |
| layout | Bande claire au bas de la section logiciel, héritée de l'ancien ordre : elle pointait vers une section devenue noire. | Bande retirée. |
| layout | Hub : des cartes auraient répété icône, titre, texte. | Liste en lignes, nom du métier en grand, ce que la page couvre à côté, sur la grille à filet central du site. |
| typeset | Veuves dans les titres de blocs (« LE CAMION QUI ROULE POUR / RIEN »). | `text-balance` sur les h2 des blocs. |
| polish | Le pied de page coupait son sous-texte après le fragment en emphase : la phrase discrète n'apparaissait pas. | Le reste de la phrase est rendu. |

## taste-skill

| Règle | Application |
| --- | --- |
| Point focal relié au produit (règle 7) | Chaque page métier a son dessin tiré du métier : façade et travée, sculpture et pain de gomme, réseau et tournée. Un seul élément volt par dessin. |
| Anti-3 colonnes, anti-cartes (règle 4, section 7) | Hub et accueil en lignes séparées par des filets. |
| Hiérarchie par opacité (règle 8) | Nom à 100 %, description à 60 ou 70 %. |
| Anti-centre (règle 3) | Héros de métier asymétrique, dessin à gauche, titre à droite. |

## emil-design-eng

| Point | Application |
| --- | --- |
| Courbe | `cubic-bezier(0.23, 1, 0.32, 1)` sur le survol des lignes, 200 ms ; propriétés nommées, jamais `transition: all`. |
| Réponse à l'appui | `active:translate-y-[1px]` en 150 ms sur chaque ligne. |
| Survol sur tactile | Variante `hover:` de Tailwind 4, déjà limitée aux pointeurs qui survolent. Aucune animation ajoutée au chargement : la liste se revoit à chaque visite. |

## visiteurs (30 visiteurs simulés, `--rapide`, deux passages en ligne)

| Chiffre | Premier passage | Après corrections |
| --- | --- | --- |
| Compris en 5 s | 97 % | 90 % |
| Restent | 87 % | 90 % |
| Trouvent le bouton | 50 % | 60 % |
| Passeraient à l'action, cible | 17 % | 22 % |

Corrigé : métiers nommés au premier écran, lien vers l'offre à côté du bouton,
« il vous appartient » à la place de « sans agence » (lu comme un discours de
concurrent), bandeau cookies raccourci. Écart sur 30 visiteurs : indicatif, pas une mesure.
Faux signaux écartés : contraste du bouton volt (texte sombre sur volt, l'outil lit
mal les deux couches), lien La Fabrique du Net (403 aux robots seulement).

## Reprise du 2026-11-01, demande d'Eliott

| Constat | Ce qui a changé |
| --- | --- |
| « Votre projet n'attend personne » remontée : l'ordre d'origine cassé. | Ordre d'origine rétabli. |
| Liste des métiers au héros : infinie à mesure des publications. | Retirée du héros et de l'accueil ; le hub reste au menu. L'accueil parle à chaque métier sans le citer. |
| Démonstration en étapes : elle disait qui fait quoi, jamais ce qu'on gagne. | Une semaine de bureau : six tâches, barres qui se rétractent au cinquième, total qui baisse, 8 h 48 rendues en aplat volt, 396 heures par an. Hypothèses affichées. Barres en `transform`, 700 ms, courbe d'Emil, décalage de 60 ms, coupées en mouvement réduit. |

---

# Usage des skills design — refonte du 2026-10-15

Demande d'Eliott : positionnement « qualité d'agence, jusqu'à deux fois moins
cher », vouvoiement, héros refait, pied de page revu, audit de toutes les pages.
Le travail visuel public a été fait par l'agent principal ; seuls les textes
(vouvoiement, corrections SEO de la carte de mots-clés) ont été délégués.

Captures, toutes en 1440 × 900 et 390 × 844, bandeau cookies fermé :

- `docs/captures/2026-10-15/avant/` : les 16 pages en ligne avant la refonte,
  pleine hauteur (26 sur 32 : six captures du site en ligne ont expiré).
- `docs/captures/2026-10-15/avant-pli/` : premier écran de l'accueil, de Caen,
  du contact et du site vitrine, en ligne.
- `docs/captures/2026-10-15/apres/` : les 16 pages après, pleine hauteur.
- `docs/captures/2026-10-15/apres-pli/` : premier écran des pages corrigées.

## impeccable

Références lues en entier : `brand.md`, `critique.md`, `audit.md`,
`typeset.md`, `layout.md`, `animate.md`, `polish.md`, `bolder.md`.
Registre : brand (site vitrine d'un indépendant). `PRODUCT.md` réécrit : il
décrivait encore la reconstruction du gabarit Framer d'origine.

| Sous-commande | Constat sur le rendu capturé | Ce qui a changé |
| --- | --- | --- |
| critique | Héros : six éléments avant l'action (logotype géant qui redit l'en-tête, prénom, titre, paraphe, mots de métier, cadre à coins avec verre flouté). Le h1 n'avait pas le premier rang de lecture. Glassmorphism décoratif (interdit absolu). | Héros reconstruit autour du h1 : les deux portes. Verre, cadre, paraphe, logotype et mots de métier retirés. |
| audit | Détecteur (`impeccable detect`) sur `src/components` et `src/app` : 10 relevés. 9 « overused-font » (Geist) et 1 « broken-image » dans un commentaire (faux positif). | Geist gardé : c'est l'identité installée du site, la règle d'impeccable laisse l'identité existante primer. Corrigés à côté : titre 404 coupé à 1440, tréma de « WÜRTH » qui faisait lire « DE.COMPTE », « Votre projet » qui débordait sa colonne à 92 px après le passage au vous, avertissement React du bandeau défilant (`animation` mêlée à `animationPlayState`), identifiants dupliqués de la réservation quand deux instances cohabitent. |
| typeset | Hiérarchie plate dans l'ancien héros (titre 48 px sous un logotype de 113 px). | Portes en `clamp(46px, 5.6vw, 80px)` au-dessus de 810, amorce de chaque porte à 60 % et chute à 100 % (hiérarchie par opacité), positionnement 22 px, corps 17 px plafonné à 46ch. |
| layout | Centre de gravité au milieu d'un cadre qui centrait tout. | Composition asymétrique : texte sur la moitié gauche, mécanisme horloger visible à droite, filet central de la grille du site gardé, preuves en pied de héros sur un filet. |
| bolder | Le seul aplat fort du héros était le logotype volt. | Le volt passe sur l'action (bouton, flèche de la porte survolée, pastille du positionnement) ; les deux portes portent le poids typographique. |
| animate | Entrée au ressort JS, pilotée par le fil principal pendant l'hydratation. | Une entrée orchestrée en CSS : filets tracés de gauche à droite, chaque ligne monte de son masque (980 ms, ease-out-expo, 90 ms entre lignes), preuves en dernier. Fondu seul en mouvement réduit. |
| polish | États d'interaction incomplets sur les portes ; pied de page qui coupait sa ligne de crédits ; « Cookies » en minuscules au milieu de liens en capitales. | Survol, focus clavier et appui sur les portes et les onglets ; ligne du bas réduite au copyright ; « Cookies » en capitales. |

## taste-skill

| Règle | Application |
| --- | --- |
| Anti-centre (variance 8) | Héros aligné à gauche, asymétrique, plus de cadre centré. |
| Hiérarchie par opacité (règle 8) | Amorce des portes à 60 %, chute à 100 %, texte d'appui à 60 %. |
| Point focal relié au produit (règle 7) | Les deux portes sont les deux offres ; le mécanisme horloger du fond (« l'outil qui tourne derrière ») reste le seul visuel. |
| Interactivité isolée | Animations en CSS ; la bascule du pied de page est un composant client isolé (`FooterContact`). |
| Pas de chiffre décoratif | Les deux preuves sont réelles : −92 % mesuré chez Würth France, 50 % calculé depuis la médiane sourcée, lien vers la source. |
| `min-h-[100dvh]` | Héros en `100dvh` (et 720 px minimum dès 810). |

## emil-design-eng

| Avant | Après | Pourquoi |
| --- | --- | --- |
| Entrée au ressort JS (motion) | Keyframes CSS hors fil principal | L'entrée reste fluide pendant l'hydratation |
| Pas d'état `:active` sur le bouton | `scale(0.97)` à l'appui | Le bouton répond au doigt |
| Survol actif sur écran tactile | Survol limité à `(hover: hover) and (pointer: fine)` | Pas de faux survol au toucher |
| Deux fonds d'onglet qui s'échangent | Une pastille déplacée en `transform`, 280 ms, `cubic-bezier(0.23, 1, 0.32, 1)` | Une seule forme qui glisse, interruptible |
| Panneau qui apparaît sec | Fondu et 14 px de montée, 360 ms | Le changement d'onglet se lit |
| Mouvement continu absent ou partout | Un seul : la pastille volt du positionnement respire (2,8 s) | Une vie discrète, pas de fatigue |

## Liste « Par besoin » du hub (2026-11-01)

Aucune forme neuve : la liste reprend `ListeMetiers`, et son titre celui de « Votre métier n'est pas dans la liste ? ». Un hub long se lit d'un mot à l'autre (`impeccable`, couper plutôt que décorer). Captures : `docs/captures/2026-11-01b`.

## Trois moyens sur l'accueil (2026-11-01)

`impeccable` : des lignes plutôt que trois cartes (grilles identiques bannies), des étapes numérotées parce qu'elles se suivent. `emil-design-eng` : le remède de chaque tâche apparaît en fondu de 300 ms avec le gain, aucune bascule de mise en page. `taste-skill` : le hub passe en plan compact, sa taille ne dépend plus du nombre de pages. Captures : `docs/captures/2026-11-01c`.

## Une tâche de A à Z dans la démonstration (2026-11-01)

Quatre pistes maquettées et capturées avant le code. `emil-design-eng` : la validation reste un vrai bouton avec retour à l'appui, et le parcours finit seul pour qui regarde sans toucher. `impeccable` : les heures rendues ne passent en volt qu'une fois la tâche finie, un seul point focal à la fois. `taste-skill` : le hub ne garde que le plan par besoin.

## La semaine rendue (2026-11-01)

Piste 2, choisie par Eliott. `emil-design-eng` : le volt monte en `scaleY` depuis le bas, décalé de 70 ms par jour, coupé en mouvement réduit. `impeccable` : un agenda plutôt qu'un graphique, le gain se voit en cases avant de se lire en chiffres.

## Prix sur devis et option référent (2026-11-01)

`impeccable` : l'accueil se suffit, le sous-titre dit ce qui est fait et la troisième ligne des moyens reste une option, sans étapes. Le déroulé part sur `/services/automatisation`. La page logiciel gagne « Comment se passe une mission », numérotée parce que les étapes se suivent.

## Ce qui n'a pas été changé, et pourquoi

- La police Geist et la palette volt sur noir : identité installée du site.
- Les héros photo des pages intérieures (sujet détouré en volt) : cohérents
  entre eux et lisibles, rien à corriger au rendu.
- Les logos d'employeurs sans intitulé dans le héros : décision d'Eliott du
  2026-09-02.

# Reprise de l'accueil et grands écrans — 2026-10-16

Demande d'Eliott : comparaison de prix à livrable égal, −92 % Würth hors du
héros, vraie section « à propos », plus d'accordéon qui redit le héros, une
section noire qui montre le logiciel, fil d'Ariane qui ne double plus le menu,
rendu correct jusqu'en 4K. Travail visuel fait par l'agent principal, sur la
direction fixée le 2026-10-15 (Geist, volt sur noir, grille à filet central) :
les règles de la passe précédente ont été reprises, aucun skill rechargé.

Captures avant et après, 390 × 844, 1024 × 768, 1440 × 900, 1920, 2240 et
3840 de large, pleine page pour les grands écrans.

| Règle reprise | Constat sur le rendu | Ce qui a changé |
| --- | --- | --- |
| impeccable · critique (une preuve, lisible en premier) | « 50 % du prix d'un site de PME en agence, médiane 6 000 € » se lisait plancher contre moyenne | Sujet nommé d'abord (« un site vitrine soigné, design et ergonomie compris »), puis « en agence 5 000 à 8 000 € » à 60 %, « avec moi dès 3 000 € » seul en volt |
| impeccable · layout | Moitié gauche de l'à-propos vide sur 200 px, colonne droite vide à côté du portrait | Grille d'infos (métier, lieu) en tête, compteur « 4 entreprises » au pied du portrait |
| impeccable · layout | L'accordéon répétait les deux portes du héros et leur chapô | Accordéon retiré de l'accueil ; une section par offre (vitrine : « On vous compare… » + réalisations ; logiciel : section noire) |
| taste · point focal relié au produit | La section noire portait une citation sans rien montrer | Fenêtre d'outil : la même commande traitée à la main (5 étapes pour vous) puis par l'outil (1 étape), bascule seule une fois visible |
| emil · une forme qui glisse | Onglets de la démo | Pastille déplacée en `transform` 280 ms `cubic-bezier(0.23, 1, 0.32, 1)`, étapes en fondu décalé 70 ms, rien en mouvement réduit |
| impeccable · polish | Fil d'Ariane en capitales et barres obliques sous le menu en capitales et barres obliques | En pied de page, casse normale, chevrons, sur le fond clair de la FAQ |
| impeccable · responsive | En 4K, héros à 22 px dans 3840, cartes projet de 2000 px de haut, logo et menu à 1 200 px du texte | `zoom` par paliers de 160 à 320 px au-delà de 2048 (rendu 1920 net en 4K), unités d'écran compensées, en-tête calé sur la colonne de 1440 |

## Refonte de l'accueil, 2026-11-24 : un expert, pas une solution

Process repris de la vidéo de Chase AI (goût, outils, direction, réglages) :
moodboard de 15 héros tirés des galeries choisies par Eliott, trois pistes
maquettées côte à côte, puis le héros retenu d'après ses retours et ses
références (rubenmarcus.dev pour le discours, conduit.framer.ai pour le
schéma, le modèle Framer « Maël Blanc » pour la présence de la personne).

| Skill · règle | Où | Effet |
|---|---|---|
| impeccable · shape, trois directions en mode départ | Pistes maquettées avant le code | Eliott a choisi sur rendu, pas sur description |
| impeccable · règle cassée exprès | Visage dans le h1, au milieu de la ligne | On voit qui parle avant de lire l'offre ; raison : Eliott vend sa personne, pas un produit |
| impeccable · interdits (barre de preuve, métrique de héros) | Barre du bas retirée | Le premier écran tient en une idée |
| emil-design-eng · mouvement utile | Trame du visage qui suit la souris, ligne « Je construis » brouillée puis posée, liens du schéma qui coulent | Coupés en mouvement réduit ; le lecteur d'écran lit la liste, jamais l'animation |
| emil-design-eng · entrée liée au défilement | Encadré blanc de « Moi, c'est Eliott » (`animation-timeline: view()`) | Rien quand le navigateur ne le gère pas |
| taste-skill · formes | Coins arrondis partout (tokens `--radius-tag/control/card/panel`) | L'ADN carré est abandonné, couleurs et typo inchangées |
| li-human | Textes du héros et du schéma | Contrôle local passé avant intégration |

## Héros version 2 « trame géante » et en-tête épuré, 2026-11-24

Eliott a retenu la version 2 parmi trois maquettes, en notant qu'elle était
« totalement étirée ». Captures avant/après (hors Git) dans `docs/heros-pistes/captures/`
(`v2-avant-*`, `v2-apres-1280|1440|1920|390`). La critique impeccable s'est
faite d'une seule tête sur les captures, sans les deux sous-agents isolés que
prévoit `critique.md` : le périmètre (un héros, un bouton) ne justifiait pas
leur coût.

| Skill · règle | Constat sur le rendu | Ce qui a changé |
|---|---|---|
| impeccable · layout (conteneur borné) | Maquette : texte collé au bord gauche, visage collé au bord droit, écart qui grandit avec l'écran | Héros dans la colonne de 1440 du site ; à 1920 texte et visage restent ensemble au centre |
| impeccable · règle de la vérité de l'image | La maquette forçait un rapport vertical de 0,95 sur une photo de 0,665 : visage étiré de 43 % | Échelle uniforme, la hauteur de la photo remplit la toile ; la toile se recadre, le visage ne se déforme plus |
| impeccable · hiérarchie | Le visage débordait sous le menu et rivalisait avec le h1 | Visage sous l'en-tête (96 px), points un peu plus sombres (opacité 0,14 à 0,86), fondu vers le texte et vers le bas |
| impeccable · adapt (mobile) | Visage trop grossier à 390 (une vingtaine de points de large) | Écart entre points calculé sur la taille rendue (5 px sur téléphone, 8 px sur ordinateur), visage au-dessus du texte, fondu vers le bas |
| impeccable · distill | Bandeau défilant de la maquette, baseline et séparateur de l'en-tête | Retirés : le héros dit déjà ce qu'Eliott fait |
| taste-skill · anti-centrage, point focal relié au produit | Héros centré de la version précédente | Texte à gauche, visage à droite : Eliott vend sa personne, le visage est le point focal |
| taste-skill · hiérarchie par opacité | Salutation 100 %, nom en volt, sous-titre 60 % | Lecture : qui, quoi, comment |
| emil-design-eng · mouvement décoratif amorti | Trame qui suit la souris | Position amortie (12 % par image), boucle arrêtée au repos et hors écran, rien en mouvement réduit |
| emil-design-eng · bouton qui répond | Bouton de l'en-tête : bloc volt plaqué de 30 px | 40 px, rayon `control`, pastille encre concentrique (`tag`) avec flèche qui avance au survol, appui à 97 %, anneau volt au clavier, survol réservé aux pointeurs fins |

LCP vérifié au navigateur à 1440 et 390 : le h1 (`hero-titre`), jamais la toile.

### Retour d'Eliott le même jour : « ma tête est trop grosse » sur ordinateur

| Skill · règle | Constat sur le rendu | Ce qui a changé |
|---|---|---|
| impeccable · quieter | Visage de 800 px de haut à 1440, il prenait toute la moitié droite | Cadre ramené à 66 % de la hauteur d'écran (620 px au plus) et à la moitié de la colonne ; le mobile, qu'Eliott trouvait propre, ne bouge pas |
| taste-skill · le point focal se décline | Le visage restait un bloc posé | La trame continue autour en champ de points pâle, et quatre angles de viseur cadrent le visage : deux motifs tirés de la trame elle-même |
| impeccable · clarify | Le sous-titre ne disait pas pourquoi lui | Sous-titre réécrit (agents qui écrivent, lui qui teste, un seul interlocuteur, finitions), passé par li-human (73,7, PASSE) ; trois repères numérotés autour du visage en reprennent les temps |
| emil-design-eng · décalage court | Repères | Fondu d'entrée décalé de 120 ms, après le texte ; rien en mouvement réduit |

Second retour du même jour : sous-titre jugé trop long et « un seul interlocuteur n'est pas un argument ». Sous-titre ramené à trois phrases courtes, repères remplacés par ce qui se vérifie (très réactif, qualité d'agence, prix corrects). li-human : aucune tournure signalée ; la note chiffrée plafonne sous 70 sur un texte de 25 mots (rythme calculé sur trois phrases), écart assumé pour la concision demandée.

## Bloc contact du pied de page, 2026-11-24 : appel d'abord, en trois étapes

Demande d'Eliott : le bloc rendez-vous / message était pénible (sujet à choisir
avant de voir un créneau, case Turnstile sous le bouton, message en trois
étapes de questionnaire). Captures avant / après dans
`docs/captures/contact-stepper/` (bureau 1440, mobile 390, chaque étape).

| Skill · règle | Où | Effet |
|---|---|---|
| impeccable · détecteur (`impeccable detect`) | Composants du bloc | Aucun motif signalé |
| impeccable · copie : pas de titre répété | Étape 2 | Le titre « De quoi voulez-vous parler ? » porte la question, la légende du champ passe en lecture d'écran seule |
| impeccable · charge cognitive, divulgation progressive | Réservation | Une décision par écran : créneau, sujet, coordonnées ; indicateur discret « Étape 2 sur 3 » et trois traits |
| impeccable · états d'erreur | Message et réservation | Erreur écrite sous le champ fautif, dans le rouge de la carte (`--neo-erreur-texte`) et non dans le vert de la marque, focus sur le premier champ fautif |
| impeccable · responsive | Mobile 390 | Bouton « Réserver l’appel » sur une ligne, champs nom / e-mail en pleine largeur, vide sous le calendrier réduit |
| emil-design-eng · entrée d'étape | `.rdv-etape` | 180 ms, fondu et 6 px, `cubic-bezier(0.23, 1, 0.32, 1)` ; fondu seul en mouvement réduit |
| emil-design-eng · retour à l'appui | Boutons d'étape | `scale(0.97)` à l'appui |

### Deuxième passe, même jour (retours d'Eliott)

| Skill · règle | Où | Effet |
|---|---|---|
| impeccable · « nested cards are always wrong », pas de conteneur par réflexe | Carte néomorphique du bloc | Retirée : le bloc se pose à plat sous le titre, filets à 12 %, coins `control`, aucune ombre, comme le reste du site |
| impeccable · rythme, densité | Étape 3 | E-mail et téléphone côte à côte (`@container`, dès 448 px), l'étape tient en trois rangées |
| impeccable · un repère plutôt qu'un écran de plus | Calendrier | La grille enchaîne sur le mois suivant ; le 1er porte « déc. » en volt, l'en-tête dit « novembre et décembre 2026 » |
| impeccable · adapt (mobile d'abord) | Créneau sous 1200 px | La date puis l'heure : le calendrier seul, puis les heures du jour touché avec « Changer de date » ; le focus suit. Bureau inchangé, côte à côte |

## Héros vivant sur ordinateur, schéma raccordé, titre mobile sur deux lignes, 2026-11-24

Demandes d'Eliott : titre mobile sur deux lignes (seule retouche mobile
permise), héros bureau « beaucoup plus vivant » avec « vraiment quelque chose
de plus » en fond, split view gardée, « Ce que je construis » mieux intégré et
aligné sur la colonne du héros. Captures (hors Git) dans
`docs/heros-pistes/captures/` : `amb-avant-*` puis `amb-v1` à `amb-v4`
(1280, 1440, 1920, 360, 390, 430, et `-schema` pour l'enchaînement).
Les règles d'impeccable et de taste-skill appliquées sont celles déjà relevées
plus haut pour ce héros ; emil-design-eng a été relu en entier pour le
mouvement.

| Skill · règle | Constat sur le rendu | Ce qui a changé |
|---|---|---|
| impeccable · adapt (une seule retouche) | 360 à 430 px : titre coupé en trois (« projet. » seul) | Taille calée sur la largeur utile (`(100vw − 40px) / 10,9`), coupure après « prouver, » partout ; le reste du mobile n'a pas bougé (captures 360/390/430 identiques hors titre) |
| taste-skill · un motif, décliné | Le fond était un aplat avec du grain ; le visage était la seule matière | Le fond reprend la trame du visage : champ de points pâle sur tout le héros, ronde lumineuse qui fait le tour et allume les points en volt, lampe sous la souris, halo qui respire, trait qui balaie le viseur |
| emil-design-eng · décor amorti, souris | Lampe collée au pointeur = artificielle | Position amortie (8 % par image), boucle arrêtée au repos ; la lampe naît sous la souris et prend le relais de la ronde, qui s'efface en 600 ms |
| emil-design-eng · transform et opacité seulement | Motif qui suit une lampe mobile | Lampe et motif bougent en `translate3d` opposés (le motif reste calé sur le champ) ; aucune propriété de mise en page animée |
| emil-design-eng · rien hors écran | Le pas du schéma (1,4 s) et les tirets tournaient même hors écran | `data-ambiance` / `data-schema="pause"` par IntersectionObserver : boucles arrêtées, animations CSS figées ; vérifié au navigateur |
| impeccable · layout (une colonne) | Schéma dans 1200 px centrés : 90 px de décalage avec le héros à 1440 | Même colonne de 1440, marges de 20 puis 30 px ; titre du schéma et texte du héros sur la même verticale, onglets calés sur le bord droit du visage |
| impeccable · rythme entre sections | Rupture de fond nette héros / schéma (grain d'un côté, aplat de l'autre) | Même grain sur ordinateur ; un fil part du bas du héros sur la colonne du texte, descend et tourne dans le trait du sur-titre, une goutte volt le parcourt ; angles de viseur repris sur le panneau |
| emil-design-eng · cascade courte | Le schéma apparaissait d'un bloc | Entrée en cascade (en-tête, panneau, cartes à 60 ms d'écart), la première fois seulement, ordinateur seulement ; sans script, tout est visible |
| emil-design-eng · mouvement réduit | — | Ni ronde, ni lampe, ni goutte (balayage retiré, « ça fait cheap ») ; champ et halo immobiles |

LCP vérifié au navigateur à 1440 et 390 : le h1 (`hero-titre`). Image de
partage régénérée (le champ et le halo y apparaissent, immobiles).

### Traits du visage, 2026-11-24

| Règle | Effet |
|---|---|
| impeccable · hiérarchie | Six traits en deux colonnes alignées (titre et bord), chacun accroché par un point à une partie du visage ; remplace les trois repères numérotés jugés « argumentaire » |
| emil-design-eng · origine | Le trait se trace depuis le point vers l'étiquette ; mouvement réduit : tracé immédiat |
| taste-skill · lisibilité | Halo sombre sous les étiquettes posées sur la trame |

### Portrait couleur au héros, 2026-11-24

| Règle | Effet |
|---|---|
| impeccable · confiance | Vraie photo couleur sur ordinateur (choix d'Eliott), détourée, calée sur les six points des traits |
| emil-design-eng · mouvement | Trame volt révélée seulement sous la souris, photo en fondu 500 ms à l'arrivée, sans fondu en mouvement réduit |
| taste-skill · performance | Photo peinte dans une toile : le titre reste le LCP ; jamais chargée sur téléphone |

## Héros refait : arrivée, photo partout, fils, 2026-11-24

Captures dans `assets-site-eliottbouquerel/captures-2026-11-24/heros/`,
numérotées : 01 avant, 02 à 04 étapes, 05 à 07 planches d'arrivée, 08 à 10
retouches après revue, 11 après (et planche de la lampe).

Direction : une arrivée en trois temps tirée de la photo elle-même. Lueur volt
(CSS, avant le script), trame de points qui naît en vague depuis le visage,
puis la photo qui s'ouvre du visage vers les bords, du flou au net. La trame et
la photo partagent le même carré : la lampe couvre toute la photo, sans bord.

### reactbits (fonds et effets de curseur)
- « Threads » retenu comme inspiration (fils qui s'écartent autour du curseur,
  « de la soie aux courbes de niveau ») : réécrit en toile 2D de 150 lignes,
  aucune dépendance. Les fonds en grille de points (« Dot Grid ») écartés :
  c'est précisément ce qu'Eliott trouvait « très IA ».

### emil-design-eng (revue de l'arrivée)
- `hero-point` partait de `scale(0)` : départ à 0,4 avec fondu.
- Points de la trame nés de rien : rayon de départ à 40 %, en fondu.
- Bouton secondaire sans transition sur `:active` : transform 160 ms.
- Flou de la photo gardé sous 20 px (14 px), courbes ease-out expo partout.

### impeccable et taste-skill (revue indépendante sur captures, verdict RETRAVAILLER, puis corrigé)
- Étiquette coupée à 360 px : colonne gauche du téléphone de 0,33 à 0,38.
- Collision titre / étiquettes à 1280 : scène à 72 %, titre à 4vw.
- Traits qui barraient les étiquettes au téléphone : épaule et cœur échangés,
  trait parti sous l'étiquette, point du cœur remonté au-dessus du titre.
- Rebond du point (loi Motion « no bounce ») : ease-out expo 420 ms.
- Fils trop volt sous la souris (taste « never compete with it ») : alpha
  0,06 + 0,18, le volt vif reste aux six traits ; coude sur la ligne du curseur
  remplacé par un écart en `tanh`.
- Attente trame → photo de 900 à 600 ms, ouverture de 1 300 à 900 ms.
- Héros raccourci (ordinateur : écran moins 270 px ; téléphone : texte remonté
  sous la photo) : le schéma entre dans le premier écran à 1440, 1280 et 390.
- Non retenu : remplacer la lueur par l'image de trame en CSS. Une image de
  fond de 780 px serait candidate au LCP et passerait devant le titre.

### li-human (descriptions des traits)
- Six descriptions ramenées à 20 signes au plus, vouvoiement, sans tiret long.
  `detect.py` juge le texte trop court pour noter le rythme ; aucun mot du
  lexique, aucune empreinte typographique.

### En-tête, bouton d'appel et étincelles, 2026-11-24

Captures : `assets-site-eliottbouquerel/captures-2026-11-24/header/` (`avant-*`, `apres-*`, numérotées).

| Skill · règle | Constat sur le rendu | Ce qui a changé |
|---|---|---|
| impeccable · cohérence de composant | Neuf boutons de rendez-vous, quatre formes (30 px plat, 48 px plat, contour, flèche en texte) | Un seul `BoutonAppel` (libellé qui permute, pastille encre portant la flèche), en compact (36/40 px) ou grand (48 px) ; ton encre sous l'aplat volt de l'estimation |
| emil-design-eng · ease-out fort, moins de 300 ms | Survol des liens : simple recoloration | Le libellé sort par le haut, sa copie volt entre par le bas (240 ms), un trait volt se dessine de gauche à droite (260 ms) et repart vers la droite ; courbe `cubic-bezier(0.23, 1, 0.32, 1)` |
| emil-design-eng · rien au doigt | — | Survols derrière `(hover: hover) and (pointer: fine)` ; au clavier, même état au focus |
| emil-design-eng · mouvement réduit | — | Transitions coupées, couleur gardée ; étincelles absentes |
| impeccable · délice mesuré | Clic sans retour hors des boutons | Huit traits volt en 400 ms au point cliqué (d'après le Click Spark de reactbits.dev), souris seulement ; canevas créé au premier clic, boucle arrêtée hors éclat, jamais candidat LCP |
| impeccable · hiérarchie de navigation | Blog au même rang que Réalisations | Blog retiré de l'en-tête et du menu mobile, gardé au pied de page et au plan du site |

Défaut trouvé sur le rendu capturé : le canevas, élément remplacé, gardait la
taille de son tampon (×2 en Retina) malgré `inset: 0`, les étincelles partaient
hors écran. Corrigé par `width/height: 100%`.

### « Moi, c'est Eliott » : coins, années, récit, 2026-11-27

Captures : `docs/captures/2026-11-27-moi-frise/` (`avant-*` en production, `etape1-*` premier rendu, `apres-*`). Bureau 1440 en trois positions du défilement, mobile 390.

| Skill · règle | Constat sur le rendu | Ce qui a changé |
|---|---|---|
| impeccable · jetons du design system | Repères, natures et barres en `rounded-full` : des ellipses à 20-26 px de haut | Étiquettes en `rounded-tag` (squircle 10 px sous `corner-shape`, 8 px ailleurs), cartes en `rounded-control`, barres de 6 px à 2 px de rayon |
| impeccable · hiérarchie par l'échelle | Années en mono 12 px sur l'axe, grandes années à 3 % d'opacité en bas | Années en 20 px gras dans un repère sur l'axe, l'année en cours en volt, un filet par colonne ; les années de fond sont retirées |
| impeccable · densité sans mur de texte | Une ligne de trois mots par étape | Une phrase de récit et une leçon « Retenu » par étape, la nature en pied de carte |
| impeccable · brand, point de vue | Rien sur la personne avant 2021 | « Avant le bac » ouvre la frise : trois verbes (démonter, jouer, optimiser) et la phrase qui les relie au métier ; terminale et robot sur l'axe |
| emil-design-eng · rien qui saute | Au doigt, ouverture sur une colonne vide (2020) au premier rendu | Ouverture sur la première carte, recalculée à chaque mesure tant que la piste n'est pas mise en page |
| li-human | Textes écrits à partir des faits donnés | `detect.py` : 51,7 puis 59,3 ; reste faible en CONCRET (aucun chiffre inventé), le concret est porté par les dates et les noms des cartes |

Défaut trouvé sur le rendu : au doigt, la deuxième mesure ramenait la piste à 0 (écart relatif au cadre déjà défilé). Corrigé en ajoutant `scrollLeft` au calcul.
