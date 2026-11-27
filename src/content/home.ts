import { duree } from "@/lib/duree";
import type { HomeContent } from "@/lib/content/types";
import { slugsMisEnAvant } from "@/content/blog";
import { faqItems } from "@/content/faq";
import { services } from "@/content/services";

import { TACHES_BUREAU } from "@/content/page-automatisation";
import { lienRendezVous } from "@/content/rendez-vous";
import { howWeDoItStats, reputationStats } from "@/content/stats";


/* LE GAIN DE L'ACCUEIL, dérivé des hypothèses de `page-automatisation.ts`. */
const PART_RELECTURE = 0.2;
const SEMAINES_AN = 45;
const reste = (minutes: number): number => Math.round(minutes * PART_RELECTURE);
const MINUTES_SEMAINE = TACHES_BUREAU.reduce((total, t) => total + t.minutes, 0);
const MINUTES_RENDUES = MINUTES_SEMAINE - reste(MINUTES_SEMAINE);
const HEURES_RENDUES_AN = Math.round((MINUTES_RENDUES * SEMAINES_AN) / 60);

// Déplacée dans `src/lib/duree.ts` : la démo l'emploie côté client.
export { duree } from "@/lib/duree";

const minutesDe = (...indices: readonly number[]): number =>
  indices.reduce((total, i) => total + TACHES_BUREAU[i].minutes, 0);

/* LA SEMAINE DE LA DÉMONSTRATION : les six tâches de `page-automatisation.ts`, posées sur cinq jours. */
const SEMAINE = [
  { jour: "Lundi", tache: "Mails", taches: [0] },
  { jour: "Mardi", tache: "Commandes", taches: [1] },
  { jour: "Mercredi", tache: "Comptes rendus", taches: [3] },
  { jour: "Jeudi", tache: "Devis", taches: [4] },
  { jour: "Vendredi", tache: "Relances, banque", taches: [2, 5] },
] as const;

const MINUTES_JOUR_MAX = Math.max(...SEMAINE.map((j) => minutesDe(...j.taches)));

const JOURS_BUREAU = SEMAINE.map(({ jour, tache, taches }) => {
  const minutes = minutesDe(...taches);
  return {
    jour,
    tache,
    part: minutes / MINUTES_JOUR_MAX,
    main: duree(minutes),
    rendu: duree(minutes - reste(minutes)),
  };
});

/*
 * UNE SEULE OFFRE DEPUIS LE 2026-10-31, décision d'Eliott du 2026-10-30. Ce qui
 * se vend : une contrainte qui disparaît et du temps gagné. Le temps humain
 * revient à ce qui rend la personne indispensable, et l'IA fait le sale boulot.
 *
 * « JUSQU'À DEUX FOIS MOINS CHER » EST PARTI AVEC LE SITE VITRINE : seule sa
 * comparaison le rendait exact (`offre.ts`). Le héros dit « une fraction » et
 * chiffre ce qu'une agence facture à côté du mien, source écrite.
 */
/*
 * LE H1 DE L'ACCUEIL depuis le 2026-11-24 : la phrase d'Eliott (« moi j'ai
 * tout à prouver, une agence non », `vault/wiki/business/copy-matiere-brute.md`).
 * Effet challenger : le manque de notoriété devient la raison de mieux faire.
 * Le métier est dit juste dessous (« Je construis… »), l'IA n'est plus en titre.
 * Une seule phrase, en blanc, sur deux lignes : l'aveu puis l'invitation
 * (demandes d'Eliott : « complète un peu, genre confiez-moi votre projet » ;
 * « c'est une phrase, ça reste en blanc, fais-le en deux lignes »).
 */
const LIGNES_TITRE = ["J’ai tout à prouver,", "confiez-moi votre projet."] as const;
const TITRE_ACCUEIL = LIGNES_TITRE.join(" ");

/**
 * Pourquoi lui (retours d'Eliott du 2026-11-24 : ne pas parler de l'IA à
 * chaque ligne, dire un truc vrai et pas banal, ni « un seul interlocuteur »
 * ni « prix corrects »). Le contraste avec l'agence, puis le résultat que veut
 * un dirigeant. Aucun chiffre promis.
 */
const COMMENT =
  "Une agence a déjà sa réputation. La mienne se joue sur votre projet : il doit vous amener des clients ou rendre des heures à votre équipe.";


/**
 * Contenu de la page d'accueil. Chaque section pointe vers sa source unique
 * (faq / stats / services / offre) : aucune duplication de texte.
 *
 * VOUVOIEMENT depuis le 2026-10-15, décision d'Eliott : il parle en « je », le
 * visiteur est « vous » sur tout le texte visible du site.
 */
export const homeContent: HomeContent = {
  hero: {
    /*
     * HÉROS REFAIT LE 2026-11-24, demande d'Eliott : se présenter comme
     * rubenmarcus.dev (« Hello, I'm… »), puis dire comment il travaille (un
     * développeur, une équipe d'IA ; version 2 « trame géante » retenue le
     * même jour), puis ce qu'il construit. Plus de porte unique vers le
     * logiciel : sites, logiciels et IA passent au même rang.
     */
    eyebrow: "Bonjour, je suis Eliott Bouquerel",
    title: TITRE_ACCUEIL,
    titleLines: LIGNES_TITRE,
    buildPrefix: "Je construis",
    buildItems: ["des sites internet", "des logiciels métier", "des automatisations IA"],
    faceNotes: [
      { partie: "front", titre: "Curieux" },
      { partie: "oeil", titre: "Exigeant" },
      { partie: "bouche", titre: "Franc" },
      { partie: "oreille", titre: "À l’écoute" },
      { partie: "epaule", titre: "Fiable" },
      { partie: "coeur", titre: "Passionné" },
    ],
    subtitle: COMMENT,
    subtitleParagraphs: [{ text: COMMENT }],
    // Plus de « Voir mes réalisations » dans le héros (2026-11-27) : le
    // numéro et le créneau suffisent, les projets suivent plus bas.
    // PHOTO RÉELLE d'Eliott (fournie le 2026-08-10), rendue en grande trame à droite du texte.
    person: {
      name: "Eliott Bouquerel",
      role: "Développeur à Caen",
      avatar: {
        src: "/images/eliott-bouquerel-avatar.jpg",
        alt: "",
        width: 400,
        height: 400,
      },
    },
  },

  /*
   * LA SECTION NOIRE MONTRE LE LOGICIEL depuis le 2026-10-16, idée d'Eliott.
   * ELLE MONTRE LE GAIN depuis le 2026-11-01, à sa demande : six tâches qui
   * parlent à tous les métiers sans en citer un, leur durée à la main, ce qui
   * reste à relire, et les heures rendues.
   *
   * LA DÉMONSTRATION EST UN EXEMPLE, et le dit : les durées sont les hypothèses
   * affichées de `/services/automatisation`, le total en est dérivé.
   */
  logiciel: {
    eyebrow: "Le temps gagné",
    // Lignes de douze signes au plus : le titre est rendu à 92 px dans une
    // demi-colonne, comme celui du showreel.
    titleLines: ["Vos heures", "valent mieux", "qu’un", "tableur."],
    statement:
      "Trier, recopier, relancer, rapprocher : une semaine de bureau part là-dedans, quel que soit votre métier. L’IA fait le sale boulot, vous validez, et le temps revient à ce qui vous rend indispensable.",
    statementEmphasis: ["vous validez, et le temps revient à ce qui vous rend indispensable."],
    cta: { label: "Voir comment", href: "/services/automatisation" },
    demo: {
      titre: "Une semaine de bureau, en exemple",
      onglets: { main: "À la main", outil: "Avec moi" },
      jours: JOURS_BUREAU,
      relire: "Relire",
      votreMetier: "Votre métier",
      preuve: "Je fais tourner ça chaque jour sur ma propre boîte mail.",
      compteur: {
        main: { valeur: duree(MINUTES_SEMAINE), minutes: MINUTES_SEMAINE, libelle: "de saisie par semaine" },
        outil: {
          valeur: duree(reste(MINUTES_SEMAINE)),
          minutes: reste(MINUTES_SEMAINE),
          libelle: "de relecture par semaine",
        },
      },
      gain: {
        valeur: duree(MINUTES_RENDUES),
        minutes: MINUTES_RENDUES,
        avant: duree(0),
        libelle: "rendues chaque semaine",
        detail: `Soit ${HEURES_RENDUES_AN} heures par an pour vos clients, vos décisions et le travail qui demande un humain.`,
      },
      note: `Exemple pour un bureau d’une dizaine de personnes, sur ${SEMAINES_AN} semaines. Il reste un cinquième du temps pour relire. Vos chiffres se mesurent pendant l’appel.`,
    },
  },

  about: {
    /*
     * UNE VRAIE SECTION « À PROPOS » depuis le 2026-10-16, demande d'Eliott :
     * le héros dit ce que je fais, la deuxième section dit qui le fait. Eliott
     * est seul : c'est son argument face aux agences, et le visiteur doit
     * savoir à qui il parle avant de lire les offres.
     *
     * L'ancien titre, « Je pars de ce que votre site doit rapporter », parlait
     * de méthode ; l'idée reste, en fin de récit.
     *
     * DÉCOUPAGE : deux lignes aux unités de sens. Toutes reçoivent le corps
     * dicté par la plus large (cf. `TitleFitText`).
     */
    title: "Moi, c’est Eliott.",
    titleLines: ["Moi,", "c’est Eliott."],
    /*
     * SCHÉMATIQUE DEPUIS LE 2026-11-27 (demande d'Eliott : « plus concis, mon
     * expérience et mon parcours de manière schématique »). Une phrase, trois
     * repères, puis la frise des postes, tirée de `/a-propos` (`about.ts`) :
     * une seule source pour le parcours. Aucun employeur n'est présenté comme
     * client, la nature de chaque poste est écrite sur la frise.
     */
    body: ["Développeur full-stack à Caen. Je travaille seul : vous parlez à celui qui code votre projet."],
    highlights: ["vous parlez à celui qui code votre projet"],
    faits: ["Full-stack · Bac+5", "Caen et visio"],
    parcoursLabel: "Parcours",
    cta: { label: "Mon parcours en détail", href: "/a-propos" },
    image: {
      src: "/images/eliott-nature-bloc.jpg",
      alt: "Portrait d’Eliott Bouquerel, développeur web freelance, au bord d’un lac",
    },
  },

  featuredWorkSlugs: ["kpsull", "wurth-creation-de-compte", "nslysium"],

  // numbers.ts — 3 chiffres sur fond accent.
  numbers: {
    // SANS ÉTIQUETTE depuis le 2026-09-24 (phase C) : le titre suffit, et
    // « Comment je travaille » redisait l'étiquette de la méthode, qui suit.
    /*
     * TITRE ET SOUS-TITRE CHOISIS PAR ELIOTT le 2026-09-24. « Pas de maquettes
     * à valider. Une adresse en ligne qui avance. » parlait de la méthode ; le
     * titre dit ce que le client y gagne. La phrase d'Eliott qui suivait (« Je
     * ne cherche pas le volume… ») est sortie : elle redisait « 1 projet à la
     * fois » avec d'autres mots.
     */
    title: "Votre projet n’attend personne.",
    // « Votre projet » déborde la colonne à 92 px (1 338 px pour 1 313) :
    // le possessif prend sa ligne.
    titleLines: ["Votre", "projet", "n’attend", "personne."],
    intro:
      "Je ne mène qu’un chantier à la fois, alors votre message a sa réponse sous 24 h ouvrées.",
    stats: howWeDoItStats,
  },

  // number.ts — « Pourquoi moi ? » : une carte chiffrée + appel.
  whyUs: {
    eyebrow: "Pourquoi moi ?",
    /* REFORMULÉ LE 2026-11-02, décision d'Eliott : « Personne ne vous tient en
       otage » se lisait comme une critique des autres prestataires. La section
       dit maintenant ce qu'il fait mieux, avec sa conviction, descendue de « Moi,
       c'est Eliott » où elle allongeait le premier aplat vert. Le titre reprend
       ses mots (« l'IA fait le sale boulot »). La carte garde la propriété du
       code et des données, dite sans viser personne. */
    title: "L’IA fait le sale boulot.",
    titleLines: ["L’IA fait", "le sale", "boulot."],
    intro:
      "Ma conviction : une machine ne remplace pas la personne qui connaît vos clients, elle la débarrasse de ce qui l’empêche de s’en occuper. Le recopiage et les factures partent au logiciel et à l’IA, et le temps rendu revient à ce qui rend votre équipe indispensable. Chaque détail est décidé, testé et documenté avant de vous être remis : rien n’est laissé au hasard.",
    stats: reputationStats,
    // LE RENDEZ-VOUS EST LE CHEMIN PRINCIPAL du site. « Voir les réalisations »
    // est parti : la section des réalisations est juste au-dessus.
    ctas: [{ label: "Réserver un créneau", href: lienRendezVous("logiciel") }],
  },

  // section06.ts — prestations en accordéon.
  services: {
    // PAS D'ÉTIQUETTE SUR L'ACCUEIL depuis le 2026-09-24 (phase C) : le chapô
    // et l'accordéon disent d'eux-mêmes ce qu'ils présentent, et le gabarit
    // étiquette / titre / paragraphe revenait cinq fois de suite.
    // IDENTIQUE à `aboutContent.services.intro` : les deux pages rendent le même
    // bloc, et un chapô qui dérive est une page qui ne dit pas la même chose que
    // l’autre sans que personne le remarque.
    intro:
      "Je pars de votre façon de travailler, et je construis le logiciel qui lui correspond : la contrainte disparaît, le temps revient à votre équipe.",
    items: services,
  },

  // SECTION TÉMOIGNAGES RETIRÉE le 2026-09-24 : son tableau était vide et le
  // composant ne rendait rien. Elle reviendra avec un vrai client (le type la
  // rend optionnelle, `HomePage` la compose si elle est présente).

  // section11.ts — bande défilante. RETIRÉE le 2026-08-10, RÉTABLIE le
  // 2026-09-01 sous une forme qui ne dit plus la même chose.
  //
  // CE QUI AVAIT MOTIVÉ LE RETRAIT reste vrai mot pour mot : « une bande de
  // logos sur un site de prestataire se lit comme voici mes clients, et
  // l'afficher sans client réel est une fausse déclaration ». Les six marques du
  // template portaient des noms lisibles à l'écran (PictelAI, Watchtower…) et
  // aucune ne correspondait à quoi que ce soit.
  //
  // CE QUI A CHANGÉ, c'est que quatre entreprises réelles peuvent être nommées,
  // et qu'aucune n'est un client : ce sont les EMPLOYEURS d'Eliott, deux
  // alternances et deux stages. Le piège est donc intact et il s'est seulement
  // déplacé : la même file de noms, sous un intitulé du genre « ils m'ont fait
  // confiance », transformerait quatre employeurs en quatre clients. Deux
  // garde-fous, l'un dans le titre, l'autre dans chaque cellule :
  //
  //   `title`  nomme la relation AVANT que la file ne soit lue ;
  //   `detail` la redit sur chaque entreprise, avec sa date.
  //
  // Le lecteur n'a rien à déduire, et un lecteur pressé qui ne verrait que les
  // cellules y lit encore « alternance » ou « stage ».
  //
  // PAS DE LOGOS, ET C'EST DÉLIBÉRÉ. Reproduire la marque figurative d'un tiers
  // sans son accord écrit est une contrefaçon (art. L713-2 CPI) ; citer son nom
  // pour dire qu'on y a travaillé est un fait vérifiable et une référence
  // nécessaire (art. L713-6). Eliott attend au même moment l'autorisation de
  // Würth pour publier une étude de cas : afficher le logo de Würth en
  // attendant cette autorisation-là serait incohérent autant qu'exposé.
  // `LogoItem.image` reste dans le type et la branche de rendu est intacte :
  // une autorisation écrite suffit à passer une cellule en logo, une par une.
  //
  // ORDRE CHRONOLOGIQUE, du plus ancien au plus récent : la bande se lit alors
  // comme un parcours, pas comme un palmarès rangé par prestige.
  /*
   * TROIS LOGOS, SANS INTITULÉ NI DATE, décision d'Eliott du 2026-09-02 :
   * « retire les mentions de en alternance ou en stage chez, retire les
   * années, je veux juste les logos ».
   *
   * MSSHOP EST SORTI de la bande (« ça fait un peu tache ») : mascotte en
   * dégradé bleu et orange au milieu de trois logotypes typographiques sobres,
   * c'est lui qu'on regardait, et pour la mauvaise raison. MECA SERVICES reste
   * dans le parcours d'Eliott, il n'est simplement plus affiché ici.
   *
   * CE QUE LE RETRAIT DU LIBELLÉ COÛTE, et c'est écrit ici pour que personne ne
   * le redécouvre plus tard : « En alternance et en stage chez » et les dates
   * disaient la NATURE du lien. Sans elles, trois logos alignés sur un site de
   * prestataire se lisent comme une page de références clients. Ce sont des
   * employeurs, Eliott n'a aucun client à ce jour, et c'est exactement la
   * fausse déclaration que le retrait du 2026-08-10 voulait éviter. Le
   * `logoBand.title` reste dans le type et le composant sait le rendre :
   * remettre une ligne suffit à refermer l'ambiguïté.
   */
  logoBand: {
    logos: [
      {
        name: "Médiapilote",
        image: {
          src: "/logos/mediapilote.png",
          alt: "Médiapilote",
          width: 138,
          height: 44,
        },
      },
      {
        name: "Würth France",
        image: { src: "/logos/wurth.png", alt: "Würth", width: 149, height: 31 },
      },
      {
        name: "MeilleursBiens",
        image: {
          src: "/logos/meilleursbiens.png",
          alt: "MeilleursBiens",
          width: 196,
          height: 23,
        },
      },
    ],
  },


  // articles.ts — « Actualités et nouveautés. » : 4 articles mis en avant
  // (source blog.ts). L'archive home affiche les 4 premiers articles.
  articles: {
    eyebrow: "Actualités et nouveautés.",
    titleLines: ["Actualités et", "nouveautés."],
    cta: { label: "Voir plus", href: "/blog" },
    // DÉRIVÉE DU REGISTRE depuis le 2026-08-28, plus écrite à la main.
    //
    // Cette liste portait quatre slugs recopiés, et la MÊME liste vivait dans
    // `about.ts`. Elle se périmait à chaque publication (un article nouveau
    // n'arrivait jamais sur l'accueil sans qu'on y pense, dans deux fichiers),
    // et elle pouvait pointer vers des slugs disparus — ce qui s'est produit au
    // passage au MDX : la sélection ne trouvait plus rien, et la section rendait
    // un titre, un bouton et RIEN entre les deux, ici comme sur `/about`.
    //
    // `slugsMisEnAvant` prend les quatre articles publiés les plus récents. Le
    // choix éditorial n'est pas perdu pour autant : `sort` étant stable, l'ordre
    // du registre tranche à date égale (cf. l'en-tête de `blog.ts`).
    featuredSlugs: slugsMisEnAvant,
  },

  faq: faqItems,

  // Habillage du bloc FAQ (les questions viennent de faq.ts).
  faqSection: {
    eyebrow: "FAQ",
    titleLines: ["Avant de", "commencer."],
    cta: { label: "Poser une question", href: "/contact" },
  },

  /*
   * ORDRE DES SECTIONS : ce qu'on y gagne et comment d'abord, puis qui, les
   * preuves, la conviction, les dernières questions. L'aplat vert des chiffres
   * suit « Pourquoi moi » depuis le 2026-11-02, décision d'Eliott : remonté sous
   * « Moi, c'est Eliott », il laissait trois sections claires d'affilée en bas
   * de page. Le design reste celui d'origine, seule la place change.
   */
  sectionOrder: [
    "hero",
    "schema",
    "about",
    "works",
    "whyUs",
    "numbers",
    "faq",
    "articles",
  ],

  seo: {
    // Mot-clé en tête, marque en fin.
    title: "Développeur à Caen : sites, logiciels et IA · Eliott Bouquerel",
    description:
      "Sites, logiciels métier et automatisations IA pour TPE et PME. J’ai tout à prouver : votre projet doit vous amener des clients. Caen et visio.",
    ogImage: {
      src: "/images/og.jpg",
      alt: "Eliott Bouquerel",
    },
  },
};
