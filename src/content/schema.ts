/**
 * LE SCHÉMA « CE QUE JE CONSTRUIS » DE L'ACCUEIL (2026-11-24, demande
 * d'Eliott, d'après le schéma d'agents de conduit.framer.ai). Un seul schéma,
 * trois onglets : l'IA n'est qu'un des trois métiers, le site et le logiciel
 * ont le leur. Chaque onglet suit une demande, de son arrivée au résultat.
 *
 * LES CHIFFRES SONT DES EXEMPLES, et le schéma le dit (`mention`).
 */

export interface NoeudSchema {
  readonly icone: string;
  readonly titre: string;
  readonly detail: string;
}

export interface ModeSchema {
  readonly id: "ia" | "site" | "logiciel";
  readonly onglet: string;
  readonly coeur: string;
  readonly etat: string;
  readonly etapes: readonly string[];
  readonly entrees: readonly NoeudSchema[];
  readonly sorties: readonly NoeudSchema[];
  readonly actions: readonly string[];
  readonly journal: string;
  readonly chiffres: readonly (readonly [string, string])[];
}

export interface SchemaContent {
  readonly eyebrow: string;
  readonly titre: string;
  readonly texte: string;
  readonly mention: string;
  readonly fait: string;
  readonly modes: readonly ModeSchema[];
}

export const schemaAccueil: SchemaContent = {
  eyebrow: "Ce que je construis",
  titre: "De la demande au résultat.",
  texte: "Choisissez ce que vous voulez améliorer. Le schéma suit une demande, de son arrivée jusqu’au résultat.",
  mention: "Exemple",
  fait: "fait",
  modes: [
    {
      id: "site",
      onglet: "Site internet",
      coeur: "Votre site",
      etat: "en ligne",
      etapes: ["Trouvé", "Compris", "Rassuré", "Contacté"],
      entrees: [
        { icone: "⌕", titre: "Recherche Google", detail: "« plombier Caen urgent »" },
        { icone: "◎", titre: "Fiche Google", detail: "avis, horaires, photos" },
        { icone: "↗", titre: "Lien partagé", detail: "réseaux, bouche-à-oreille" },
      ],
      sorties: [
        { icone: "✉", titre: "Demande de devis", detail: "complète, dans votre boîte" },
        { icone: "◷", titre: "Rendez-vous réservé", detail: "agenda en ligne" },
        { icone: "☏", titre: "Appel direct", detail: "depuis le téléphone" },
      ],
      actions: ["un visiteur lit la page Rénovation", "il regarde vos réalisations", "il envoie sa demande de devis"],
      journal: "14:07 · nouvelle demande, salle de bain, budget indiqué",
      chiffres: [
        ["Chargement", "0,8 s"],
        ["Demandes ce mois", "27"],
      ],
    },
    {
      id: "logiciel",
      onglet: "Logiciel métier",
      coeur: "Votre logiciel",
      etat: "à jour",
      etapes: ["Saisi", "Planifié", "Livré", "Facturé"],
      entrees: [
        { icone: "✉", titre: "Commande par mail", detail: "lue et pré-remplie" },
        { icone: "☏", titre: "Commande au téléphone", detail: "saisie en 30 s" },
        { icone: "▢", titre: "Bon papier", detail: "photo, texte reconnu" },
      ],
      sorties: [
        { icone: "◷", titre: "Planning de l’équipe", detail: "tournée calculée" },
        { icone: "▤", titre: "Bon de livraison", detail: "signé sur le téléphone" },
        { icone: "€", titre: "Facture et relance", detail: "envoyée, suivie" },
      ],
      actions: ["planifie la livraison de la commande 4127", "prépare le bon de livraison", "émet la facture au départ du camion"],
      journal: "16:30 · 12 factures parties, aucune recopiée",
      chiffres: [
        ["Saisies évitées", "142"],
        ["Heures rendues / semaine", "11 h"],
      ],
    },
    {
      id: "ia",
      onglet: "Intégration d’IA",
      coeur: "Assistant IA",
      etat: "en marche",
      etapes: ["Lit", "Comprend", "Rédige", "Accord"],
      entrees: [
        { icone: "✉", titre: "Mail entrant", detail: "contact@, 6 nouveaux" },
        { icone: "▢", titre: "Formulaire du site", detail: "demande de devis" },
        { icone: "☏", titre: "Message WhatsApp", detail: "2 conversations" },
      ],
      sorties: [
        { icone: "◫", titre: "Fiche client à jour", detail: "affaire créée" },
        { icone: "◷", titre: "Rendez-vous proposé", detail: "jeudi 10 h 30" },
        { icone: "◉", titre: "Collègue prévenu", detail: "au bon moment" },
      ],
      actions: ["prépare une réponse à la demande de devis", "classe 4 mails sans suite", "propose un créneau à Mme Martin"],
      journal: "09:42 · réponse prête, en attente de votre accord",
      chiffres: [
        ["Traité ce matin", "38"],
        ["À valider", "3"],
      ],
    },
  ],
};
