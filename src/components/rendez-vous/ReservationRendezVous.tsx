"use client";

/**
 * Prise de rendez-vous, entièrement dessinée ici — composant CLIENT.
 *
 * LE MOTEUR EST LE COCKPIT depuis le 2026-11-02 (avant : Cal.com). Ce composant
 * ne parle qu'aux routes du site (`/api/rendez-vous/*`), qui relaient au
 * cockpit côté serveur (`src/lib/rendez-vous/cockpit.ts`). `Calendrier` et
 * `Heures` sont exportés : la page `/rdv/gerer/[jeton]` les réutilise.
 *
 * TROIS ÉTAPES DEPUIS LE 2026-11-24 (Eliott) : le créneau, affiché sans clic
 * préalable ; le sujet, écrit avec les mots du visiteur (plus de boutons
 * Logiciel / Site / IA) ; les coordonnées. Le sujet écrit part au cockpit en
 * notes et en `reponses.coince`, que le mail de confirmation reprend. Le type
 * envoyé est celui du lien (`?sujet=`) ou, à défaut, `SUJET_PAR_DEFAUT`
 * (« Premier échange »). Les clients en cours (`/rdv/client`) gardent leurs
 * quatre boutons de sujet à la première étape, et seuls le nom et l'e-mail
 * leur sont exigés.
 *
 * LA DURÉE EST CELLE DU TYPE AU COCKPIT, par défaut : le visiteur n'a plus à la
 * choisir.
 *
 * AUCUNE ANIMATION D'APPARITION ICI, contrairement au reste du site. `Reveal`
 * rend l'état MASQUÉ dès le serveur et compte sur une animation pour le lever :
 * dans un onglet d'arrière-plan, le bloc resterait invisible. Sur le
 * formulaire par lequel passe un rendez-vous, c'est une conversion perdue.
 *
 * ACCESSIBILITÉ — les points qui comptent :
 *   - le sujet est un vrai groupe de `radio` dans un `fieldset`, avec une
 *     pastille visible que l'anneau de focus global peut entourer ;
 *   - chaque jour du calendrier porte son libellé complet, les jours sans
 *     créneau sont désactivés, et l'état d'envoi passe par la région live de
 *     `MessageEtat`.
 */

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import {
  ChampsProtection,
  MentionRecaptcha,
  MessageEtat,
} from "@/components/forms/ProtectionFormulaire";
import { useProtectionFormulaire } from "@/components/forms/protection";
import { NOM_CHAMP_PIEGE } from "@/components/forms/useEnvoiFormulaire";
import type { EtatEnvoi } from "@/components/forms/useEnvoiFormulaire";
import {
  MESSAGE_RESEAU,
  messageEchecInconnu,
  messageProtectionAbsente,
} from "@/components/rendez-vous/messages";
import { Icon, Spinner } from "@/components/ui";
import { rendezVousContent } from "@/content/rendez-vous";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { capture } from "@/lib/analytics/posthog";
import { lireTelephone } from "@/lib/contact/validation";
import type { IdRendezVous, TypeRendezVous } from "@/content/rendez-vous";
import {
  ajouterMois,
  ecartEnJours,
  formaterDeuxMois,
  formaterJour,
  grilleMois,
  grilleSemaines,
  moisCourt,
  JOURS_SEMAINE,
  lireReponseCreneaux,
  numeroDuJour,
} from "@/lib/rendez-vous/creneaux";
import type {
  Creneau,
  JourDeCreneaux,
  ReponseCreneaux,
} from "@/lib/rendez-vous/creneaux";
import { estTypeClient, SUJET_PAR_DEFAUT } from "@/lib/rendez-vous/config";
import { LONGUEUR_LIGNE_MAX } from "@/lib/rendez-vous/questionnaire";

const contenu = rendezVousContent;

/** Ce qui empêche d'afficher des créneaux, du plus bénin au plus définitif. */
type EtatCreneaux = "aucune" | "reseau" | "indisponible";

/**
 * Dernier résultat reçu, avec la QUESTION à laquelle il répond.
 *
 * Garder la clef à côté de la réponse est ce qui permet de déduire le
 * chargement au lieu de le stocker, et d'écarter au rendu une réponse arrivée
 * après que le prospect a changé d'avis.
 */
interface ResultatCreneaux {
  readonly cle: string;
  readonly type: IdRendezVous | undefined;
  readonly etat: EtatCreneaux;
  readonly donnees?: ReponseCreneaux;
}

function estMessage(charge: unknown): charge is { message: string; champ?: string } {
  return (
    typeof charge === "object" &&
    charge !== null &&
    typeof (charge as Record<string, unknown>).message === "string"
  );
}


export const CLASSE_LIBELLE =
  "text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground/80";

export const CLASSE_CHAMP =
  "h-[52px] w-full rounded-control border border-white/45 bg-white/[0.04] px-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground transition-colors placeholder:text-white/45 hover:border-white/60 focus:border-accent tablet:text-[15px]";

export const CLASSE_TEXTE =
  "text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60";

export const CLASSE_BOUTON_SECONDAIRE =
  "flex min-h-[44px] items-center gap-[8px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 transition-colors hover:text-accent motion-reduce:transition-none";

/** Contour d'un champ refusé : le rouge de la carte, pas le vert de la marque. */
const CLASSE_BORDURE_ERREUR = "border-[var(--neo-erreur,#ff6b5a)]";

/** Bouton d'étape (Continuer, Confirmer) : à droite, à sa largeur. */
const CLASSE_BOUTON_ETAPE =
  "flex h-[52px] items-center justify-center whitespace-nowrap rounded-control bg-accent px-[24px] text-[13px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink transition-[opacity,transform] duration-150 ease-out active:scale-[0.97] disabled:cursor-progress disabled:opacity-60 motion-reduce:transition-none";

/** Retour à l'étape précédente : discret, à gauche. */
const CLASSE_BOUTON_RETOUR =
  "flex h-[52px] items-center gap-[8px] rounded-control px-[4px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 transition-colors hover:text-foreground motion-reduce:transition-none";

export const CLASSE_BOUTON_PRINCIPAL =
  "flex h-[52px] w-full items-center justify-center rounded-control bg-accent px-[28px] text-[13px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink transition-[opacity,transform] duration-150 ease-out active:scale-[0.98] disabled:cursor-progress disabled:opacity-60 motion-reduce:transition-none tablet:w-fit";


/** Vrai quand le visiteur a demandé moins de mouvement ; faux là où la requête n'existe pas. */
function mouvementReduit(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Une réponse libre : libellé, champ (une ligne ou plusieurs), erreur dessous.
 *
 * L'erreur est reliée au champ par `aria-describedby`, comme celle d'un groupe
 * de `ChoixUnique` : le lecteur d'écran la lit en arrivant sur le champ.
 */
function ChampTexte({
  id,
  nom,
  legende,
  valeur,
  onChanger,
  placeholder,
  erreur,
  aide,
  refChamp,
  multiligne = false,
  maxLength,
  type = "text",
  autoComplete,
  inputMode,
  requis = false,
  invalide = false,
  legendeMasquee = false,
}: {
  id: string;
  nom: string;
  legende: string;
  valeur: string;
  onChanger: (valeur: string) => void;
  placeholder?: string;
  erreur?: string;
  aide?: string;
  refChamp?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  multiligne?: boolean;
  maxLength?: number;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  requis?: boolean;
  /** Bordure d'erreur sans texte : le message du serveur s'affiche sous le formulaire. */
  invalide?: boolean;
  /** Légende lue au lecteur d'écran seulement : le titre de l'étape la dit déjà. */
  legendeMasquee?: boolean;
}) {
  const idErreur = `${id}-erreur`;
  const idAide = `${id}-aide`;
  const decrit = [aide ? idAide : undefined, erreur ? idErreur : undefined]
    .filter(Boolean)
    .join(" ");
  const commun = {
    id,
    name: nom,
    value: valeur,
    maxLength,
    placeholder,
    required: requis || undefined,
    "aria-invalid": erreur || invalide ? true : undefined,
    "aria-describedby": decrit || undefined,
  } as const;
  return (
    // Le libellé ne porte que la légende : l'aide et l'erreur passent par
    // `aria-describedby`, sans être lues deux fois.
    <div className="flex w-full flex-col gap-[10px]">
      <label htmlFor={id} className={legendeMasquee ? "sr-only" : CLASSE_LIBELLE}>
        {legende}
      </label>
      {multiligne ? (
        <textarea
          {...commun}
          ref={refChamp as RefObject<HTMLTextAreaElement | null> | undefined}
          onChange={(evenement) => onChanger(evenement.target.value)}
          className={`min-h-[110px] w-full resize-y rounded-control border border-white/45 bg-white/[0.04] p-[16px] text-[16px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground transition-colors placeholder:text-white/45 hover:border-white/60 focus:border-accent tablet:text-[15px] ${erreur || invalide ? CLASSE_BORDURE_ERREUR : ""}`}
        />
      ) : (
        <input
          {...commun}
          ref={refChamp as RefObject<HTMLInputElement | null> | undefined}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          onChange={(evenement) => onChanger(evenement.target.value)}
          className={`${CLASSE_CHAMP} ${erreur || invalide ? CLASSE_BORDURE_ERREUR : ""}`}
        />
      )}
      {aide ? (
        <span id={idAide} className="-mt-[2px] mb-[8px] text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
          {aide}
        </span>
      ) : null}
      {erreur ? (
        <span
          id={idErreur}
          className="text-[13px] font-medium leading-[1.3] tracking-[-0.01em] text-[var(--neo-erreur-texte,#ff8c7f)]"
        >
          {erreur}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Calendrier d'un mois : les jours qui ont au moins un créneau sont des
 * cases bordées cliquables, les autres restent lisibles mais grisés et sans
 * cadre.
 *
 * UN MOIS ENTIER ET NON UNE BANDE DE JOURS : le prospect voit d'un coup d'œil
 * quand il y a de la place, et un jour sans créneau se lit comme tel au lieu
 * de disparaître de la bande.
 */
export function Calendrier({
  donnees,
  suite,
  jourActif,
  chargement,
  onChoisirJour,
  onDecaler,
}: {
  donnees: ReponseCreneaux;
  /**
   * Créneaux du mois suivant (2026-11-24) : la grille enchaîne dessus au lieu
   * de s'arrêter au dernier jour du mois, et le 1er porte le nom de son mois.
   */
  suite?: ReponseCreneaux;
  jourActif: JourDeCreneaux | undefined;
  chargement: boolean;
  onChoisirJour: (jour: string) => void;
  onDecaler: (mois: number) => void;
}) {
  const disponibles = new Map(
    [...donnees.jours, ...(suite?.jours ?? [])].map((jour) => [jour.jour, jour]),
  );
  /*
   * LES SEMAINES DÉJÀ PASSÉES DISPARAISSENT (2026-11-22) : en fin de mois, trois
   * rangées de jours grisés repoussaient les heures sous le pli du téléphone.
   * Une semaine reste dès qu'un de ses jours atteint le début de la fenêtre.
   *
   * AVEC LE MOIS SUIVANT, cinq semaines pleines depuis la semaine du premier
   * jour ouvert (au moins jusqu'à la fin du mois affiché) : les jours d'après
   * remplissent la grille au lieu de laisser une rangée vide.
   */
  const grille = grilleMois(donnees.fenetre.mois);
  const cases: readonly (string | null)[] = suite
    ? grilleSemaines(
        donnees.fenetre.debut,
        Math.max(5, Math.ceil((ecartEnJours(grilleSemaines(donnees.fenetre.debut, 1)[0] ?? donnees.fenetre.debut, donnees.fenetre.fin) + 1) / 7)),
      )
    : grille.filter((_, index) => {
        const debutSemaine = index - (index % 7);
        return grille
          .slice(debutSemaine, debutSemaine + 7)
          .some((jour) => jour !== null && jour >= donnees.fenetre.debut);
      });
  const libelle = suite
    ? formaterDeuxMois(donnees.fenetre.mois, suite.fenetre.mois)
    : donnees.fenetre.libelle;
  // `aria-disabled` et non `disabled` : un bouton désactivé perd le focus, et
  // il le perdrait au moment précis où le clavier vient de l'actionner (le
  // chargement du mois suivant, ou l'arrivée au bout de la fenêtre).
  const classeNavigation =
    "flex size-[36px] items-center justify-center rounded-control border border-border text-foreground transition-colors hover:border-accent hover:text-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-30 aria-disabled:hover:border-border aria-disabled:hover:text-foreground motion-reduce:transition-none";
  const precedentBloque = donnees.fenetre.premiere || chargement;
  const suivantBloque = donnees.fenetre.derniere || chargement;

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-center justify-between gap-[16px]">
        <p className="m-0 text-[14px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground">
          {libelle}
        </p>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            className={classeNavigation}
            aria-disabled={precedentBloque}
            onClick={() => {
              if (!precedentBloque) onDecaler(-1);
            }}
          >
            <Icon
              name="arrow"
              size={16}
              className="rotate-180"
              label={contenu.actions.moisPrecedent}
            />
          </button>
          <button
            type="button"
            className={classeNavigation}
            aria-disabled={suivantBloque}
            onClick={() => {
              if (!suivantBloque) onDecaler(1);
            }}
          >
            <Icon name="arrow" size={16} label={contenu.actions.moisSuivant} />
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-label={contenu.creneaux.libelleCalendrier}
        aria-busy={chargement}
        className={`grid grid-cols-7 gap-[4px] transition-opacity motion-reduce:transition-none ${
          chargement ? "opacity-40" : ""
        }`}
      >
        {JOURS_SEMAINE.map((jour) => (
          <span
            key={jour}
            aria-hidden
            className="pb-[4px] text-center text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60"
          >
            {jour}
          </span>
        ))}
        {cases.map((jour, index) => {
          if (jour === null) return <span key={`vide-${index}`} aria-hidden />;
          const disponible = disponibles.get(jour);
          const actif = disponible !== undefined && jour === jourActif?.jour;
          /** Le 1er du mois suivant porte le nom de son mois, au-dessus du chiffre. */
          const nouveauMois = suite !== undefined && jour.endsWith("-01") && jour > donnees.fenetre.debut;
          return (
            <button
              key={jour}
              type="button"
              disabled={!disponible || chargement}
              aria-pressed={disponible ? actif : undefined}
              aria-label={disponible ? disponible.libelle : formaterJour(jour)}
              onClick={() => onChoisirJour(jour)}
              className={`relative flex h-[44px] flex-col items-center justify-center rounded-control border text-[14px] font-medium leading-none tracking-[-0.01em] transition-colors motion-reduce:transition-none ${
                actif
                  ? "border-accent bg-accent text-accent-ink"
                  : disponible
                    ? "border-border text-foreground hover:border-accent hover:text-accent"
                    : "cursor-default border-transparent text-white/40"
              }`}
            >
              {nouveauMois ? (
                <span
                  aria-hidden
                  className={`mb-[3px] text-[9px] font-semibold uppercase leading-none tracking-[0.02em] ${
                    actif ? "text-accent-ink" : "text-accent"
                  }`}
                >
                  {moisCourt(jour)}
                </span>
              ) : null}
              {numeroDuJour(jour)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Heures libres du jour retenu, en grille serrée. */
export function Heures({
  jour,
  choisi,
  onChoisir,
}: {
  jour: JourDeCreneaux;
  choisi: Creneau | undefined;
  onChoisir: (creneau: Creneau) => void;
}) {
  return (
    <div className="relative flex flex-col gap-[14px] desktop:h-full">
      {/* Pas de capitales ici : « 1er » deviendrait « 1ER ». */}
      <p className="m-0 flex min-h-[36px] items-center text-[14px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
        {jour.libelle}
      </p>
      {/* À PARTIR DE 1200, LA COLONNE DÉFILE à la hauteur du calendrier, qu'elle
          épouse en position absolue sous le libellé du jour (36 + 14 px) : une
          journée ouverte au quart d'heure compte près de trente heures, soit
          deux fois la hauteur du mois d'à côté. `data-lenis-prevent` rend la
          molette à cette colonne, Lenis gardant la page. En dessous, la grille
          passe sous le calendrier sur quatre colonnes et tient sans défiler. */}
      <div
        role="group"
        aria-label={`${contenu.creneaux.libelleGrille} ${jour.libelle}`}
        data-lenis-prevent
        className="grid grid-cols-4 content-start gap-[6px] desktop:absolute desktop:inset-x-0 desktop:bottom-0 desktop:top-[50px] desktop:grid-cols-3 desktop:overflow-y-auto desktop:overscroll-contain desktop:pb-[28px] desktop:pr-[6px] desktop:[mask-image:linear-gradient(to_bottom,black_calc(100%-40px),transparent)] [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin]"
      >
        {jour.creneaux.map((creneau) => {
          const actif = creneau.debut === choisi?.debut;
          return (
            <button
              key={creneau.debut}
              type="button"
              aria-pressed={actif}
              // Anneau INTÉRIEUR : la colonne défile, et un anneau extérieur y
              // serait rogné par le bord du conteneur.
              data-focus-ring="inset"
              onClick={() => onChoisir(creneau)}
              className={`h-[44px] rounded-control border text-[13px] font-medium leading-[1.2] tracking-[-0.01em] transition-colors motion-reduce:transition-none ${
                actif
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-border text-foreground hover:border-accent hover:text-accent"
              }`}
            >
              {creneau.heure}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Les boutons de sujet : un seul actif, un clic le retient et charge les créneaux. */
function BoutonsSujet({
  prefixe,
  types,
  choisi,
  onChoisir,
  decrire,
}: {
  prefixe: string;
  types: readonly TypeRendezVous[];
  choisi: IdRendezVous | undefined;
  onChoisir: (id: IdRendezVous) => void;
  /** Faux tant que le sujet est celui par défaut : le calendrier passe avant l'explication. */
  decrire: boolean;
}) {
  const description = decrire
    ? types.find((type) => type.id === choisi)?.description
    : undefined;
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-[12px] border-0 p-0">
      <legend className={`${CLASSE_LIBELLE} mb-[12px] p-0`}>{contenu.blocs.sujet}</legend>
      {/* Des `radio` : flèches au clavier, « 2 sur 4 » au lecteur d'écran, et
          une pastille visible que l'anneau de focus global peut entourer. */}
      <div className="grid grid-cols-2 gap-[10px] tablet:grid-cols-4">
        {types.map((type) => {
          const actif = type.id === choisi;
          const id = `${prefixe}-sujet-${type.id}`;
          return (
            <label
              key={type.id}
              htmlFor={id}
              className={`flex h-[52px] cursor-pointer items-center justify-center rounded-control border px-[12px] text-center text-[16px] font-medium leading-[1.2] tracking-[-0.01em] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent motion-reduce:transition-none ${
                actif
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-white/45 text-foreground hover:border-white/70"
              }`}
            >
              <input
                id={id}
                type="radio"
                name={`${prefixe}-sujet`}
                value={type.id}
                checked={actif}
                onChange={() => onChoisir(type.id)}
                className="sr-only"
              />
              {type.nom}
            </label>
          );
        })}
      </div>
      {description ? <p className={`${CLASSE_TEXTE} m-0`}>{description}</p> : null}
    </fieldset>
  );
}

/** Étape qui porte chaque champ, pour y revenir quand le serveur le refuse. */
const ETAPE_DU_CHAMP: Readonly<Record<string, Etape>> = {
  type: 0,
  creneau: 0,
  duree: 0,
  message: 1,
  nom: 2,
  email: 2,
  telephone: 2,
};

type Etape = 0 | 1 | 2;
const NOMBRE_ETAPES = 3;

/** Longueur minimale d'un sujet écrit : « Site » passe, une lettre non. */
const SUJET_MIN = 3;

/**
 * Indicateur d'étape : trois traits, le titre de l'étape et « Étape 2 sur 3 ».
 * Le titre prend le focus à chaque changement d'étape, et le compteur lui est
 * relié : le lecteur d'écran annonce les deux.
 */
function EnteteEtape({
  etape,
  refTitre,
  idCompteur,
}: {
  etape: Etape;
  refTitre: RefObject<HTMLHeadingElement | null>;
  idCompteur: string;
}) {
  return (
    <div className="flex flex-col gap-[14px]">
      <div aria-hidden className="grid grid-cols-3 gap-[6px]">
        {contenu.etapes.titres.map((titre, index) => (
          <span
            key={titre}
            className={`h-[3px] rounded-[2px] transition-colors duration-200 ease-out motion-reduce:transition-none ${
              index <= etape ? "bg-accent" : "bg-white/15"
            }`}
          />
        ))}
      </div>
      <div className="flex items-baseline justify-between gap-[16px]">
        <h3
          ref={refTitre}
          tabIndex={-1}
          aria-describedby={idCompteur}
          className="m-0 text-[20px] font-medium leading-[1.15] tracking-[-0.02em] text-foreground outline-none tablet:text-[22px]"
        >
          {contenu.etapes.titres[etape]}
        </h3>
        <p
          id={idCompteur}
          className="m-0 shrink-0 text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60"
        >
          {contenu.etapes.compteur(etape + 1, NOMBRE_ETAPES)}
        </p>
      </div>
    </div>
  );
}

export function ReservationRendezVous({
  types,
  emailContact,
  typeInitial,
  typeParDefaut,
}: {
  /** Types RÉELLEMENT configurés, résolus côté serveur. Jamais vide ici. */
  types: readonly TypeRendezVous[];
  /** Adresse publiée, affichée en repli quand la réservation ne peut aboutir. */
  emailContact: string;
  /**
   * Sujet déjà choisi à l'arrivée, lu dans `?sujet` par l'appelant (liens des
   * mails `/rdv?sujet=logiciel`) : il part au cockpit comme type, sans bouton
   * à l'écran. Un sujet de client seul s'affiche en titre.
   */
  typeInitial?: IdRendezVous;
  /**
   * Sujet retenu quand l'URL n'en donne aucun. Sans lui, un premier rendez-vous
   * prend `SUJET_PAR_DEFAUT` (« Premier échange ») : les créneaux s'affichent
   * sans clic préalable, dans le pied de page comme sur `/rdv`.
   */
  typeParDefaut?: IdRendezVous;
}) {
  // Préfixe des identifiants et des groupes de boutons radio : la page de
  // contact et le pied de page peuvent monter deux réservations à la fois.
  const instance = `rdv${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  /** Page `/rdv/client` : quatre sujets de clients, à choisir par bouton. */
  const pageClient = types.length > 1 && types.every((entree) => estTypeClient(entree.id));
  const defautPremier = types.some((entree) => entree.id === SUJET_PAR_DEFAUT)
    ? SUJET_PAR_DEFAUT
    : types.find((entree) => !estTypeClient(entree.id))?.id;
  const typeDepart = typeInitial ?? typeParDefaut ?? (pageClient ? undefined : defautPremier);
  const [type, setType] = useState<IdRendezVous | undefined>(typeDepart);
  /** Vrai dès que le sujet vient du visiteur ou de son lien, pas du défaut. */
  const [sujetChoisi, setSujetChoisi] = useState(typeInitial !== undefined);
  const [etape, setEtape] = useState<Etape>(0);
  const [creneau, setCreneau] = useState<Creneau | undefined>(undefined);
  const [mois, setMois] = useState("");
  const [jourChoisi, setJourChoisi] = useState("");
  /** Incrémenté par « Réessayer » : c'est ce qui relance l'effet à l'identique. */
  const [tentative, setTentative] = useState(0);
  const [resultat, setResultat] = useState<ResultatCreneaux>({
    cle: "",
    type: undefined,
    etat: "aucune",
  });
  /**
   * Le bloc approche de l'écran. Le pied de page est sur toutes les pages : sans
   * cette garde, chaque page vue demanderait les créneaux au cockpit, donc à
   * Google Agenda. Sans `IntersectionObserver` (tests), tout de suite.
   */
  const [proche, setProche] = useState(
    () => typeof window !== "undefined" && typeof IntersectionObserver === "undefined",
  );

  /**
   * Clef de la requête EN COURS DE VALIDITÉ.
   *
   * `chargement` n'est PAS un état : c'est le simple constat que le dernier
   * résultat reçu ne répond pas à la question posée. Le tenir en état
   * obligerait à un `setChargement(true)` en tête d'effet, donc à une cascade
   * de rendus dont `react-hooks/set-state-in-effect` ne veut pas.
   */
  const cle = type ? `${type}|${mois}|${tentative}` : "";
  const chargement = type !== undefined && resultat.cle !== cle;
  // Les créneaux du type PRÉCÉDENT ne survivent pas à un changement de sujet ;
  // ceux du mois précédent, si, le temps que la suite arrive.
  const donnees = resultat.type === type ? resultat.donnees : undefined;
  const etatCreneaux: EtatCreneaux =
    resultat.type === type && resultat.cle === cle ? resultat.etat : "aucune";
  /**
   * Le mois suivant, chargé derrière le mois affiché : le calendrier enchaîne
   * dessus (2026-11-24). Même clef que la question posée, pour écarter une
   * réponse arrivée après un changement de mois.
   */
  const [suiteBrute, setSuiteBrute] = useState<{ cle: string; donnees: ReponseCreneaux } | undefined>(undefined);
  const moisSuivant =
    donnees && !donnees.fenetre.derniere ? ajouterMois(donnees.fenetre.mois, 1) : undefined;
  const cleSuite = type && moisSuivant ? `${type}|${moisSuivant}|${tentative}` : "";
  const suite = suiteBrute && suiteBrute.cle === cleSuite ? suiteBrute.donnees : undefined;
  const joursOuverts = [...(donnees?.jours ?? []), ...(suite?.jours ?? [])];
  /**
   * Jour affiché — DÉDUIT, jamais synchronisé : le jour retenu s'il existe
   * encore dans la donnée, sinon le premier jour disponible.
   */
  const jourActif = joursOuverts.find((jour) => jour.jour === jourChoisi) ?? joursOuverts[0];
  /**
   * L'heure retenue SURVIT À UN CHANGEMENT DE SUJET tant que le nouveau sujet
   * la propose aussi (chaque type a ses plages et sa durée au cockpit).
   */
  const creneauRetenu =
    creneau &&
    (chargement ||
      joursOuverts.some((jour) =>
        jour.creneaux.some((offert) => offert.debut === creneau.debut),
      ))
      ? creneau
      : undefined;

  const [etatEnvoi, setEtatEnvoi] = useState<EtatEnvoi>("repos");
  const [messageEnvoi, setMessageEnvoi] = useState("");
  const [champEnErreur, setChampEnErreur] = useState<string | undefined>(undefined);
  const protection = useProtectionFormulaire("rendez_vous");

  /** Le créneau réservé, gardé pour l'écran de confirmation (le formulaire disparaît). */
  const [resumeSucces, setResumeSucces] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [message, setMessage] = useState("");
  /** Un client en cours (`/rdv/client`) ne donne que nom et e-mail : le reste est facultatif. */
  const client = estTypeClient(type);
  const typeChoisi = types.find((entree) => entree.id === type);

  /**
   * Horodatage d'affichage, posé APRÈS le montage.
   *
   * Il n'est pas initialisé pendant le rendu : la valeur serait calculée côté
   * serveur, et une page servie il y a deux heures ferait rejeter la
   * réservation par le contrôle de délai maximal.
   */
  const refDebut = useRef(0);
  useEffect(() => {
    refDebut.current = Date.now();
  }, []);

  const racine = useRef<HTMLDivElement | null>(null);
  const refTitre = useRef<HTMLHeadingElement | null>(null);
  const refSucces = useRef<HTMLParagraphElement | null>(null);
  const saisieAnnoncee = useRef(false);
  /** Dernière étape focalisée : le premier affichage ne vole pas le focus. */
  const refEtapeVue = useRef<Etape>(0);
  /** Le focus va au succès : le formulaire disparaît, le clavier ne doit pas retomber sur le document. */
  useEffect(() => {
    if (etatEnvoi === "succes") refSucces.current?.focus();
  }, [etatEnvoi]);

  /*
   * LE FOCUS SUIT L'ÉTAPE : le titre de la nouvelle étape le prend, le lecteur
   * d'écran l'annonce avec son compteur, et le haut du bloc revient en vue sur
   * téléphone (le bouton « Continuer » était en bas d'un long calendrier).
   */
  useEffect(() => {
    if (refEtapeVue.current === etape) return;
    refEtapeVue.current = etape;
    refTitre.current?.focus({ preventScroll: true });
    const haut = racine.current?.getBoundingClientRect().top;
    if (haut !== undefined && haut < 0) {
      racine.current?.scrollIntoView({
        block: "start",
        behavior: mouvementReduit() ? "auto" : "smooth",
      });
    }
  }, [etape]);

  /*
   * PREMIÈRE ÉTAPE DE L'ENTONNOIR : le bloc vu, une fois, à sa première
   * visibilité. Le même observateur, avec une marge large, autorise le
   * chargement des créneaux un peu avant que le bloc n'arrive à l'écran.
   */
  const vueAnnoncee = useRef(false);
  useEffect(() => {
    const annoncer = () => {
      if (vueAnnoncee.current) return;
      vueAnnoncee.current = true;
      capture(ANALYTICS_EVENTS.rdvViewed, { rdv_type: typeDepart, preselected: typeInitial !== undefined });
    };
    const noeud = racine.current;
    if (!noeud || typeof IntersectionObserver === "undefined") {
      annoncer();
      return;
    }
    const approche = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((entree) => entree.isIntersecting)) return;
        approche.disconnect();
        setProche(true);
      },
      { rootMargin: "800px 0px" },
    );
    const observateur = new IntersectionObserver((entrees) => {
      if (!entrees.some((entree) => entree.isIntersecting)) return;
      observateur.disconnect();
      annoncer();
    });
    approche.observe(noeud);
    observateur.observe(noeud);
    return () => {
      approche.disconnect();
      observateur.disconnect();
    };
  }, [typeDepart, typeInitial]);

  /*
   * UN SUJET PRÉSÉLECTIONNÉ FRANCHIT LA MÊME MARCHE QU'UN SUJET CHOISI : sur
   * `/rdv?sujet=…`, le prospect n'appuie sur rien. L'événement part à la
   * première visibilité du bloc, après `section_viewed` (entonnoir ordonné de
   * PostHog), et une seule fois.
   */
  const sujetInitialAnnonce = useRef(false);
  useEffect(() => {
    if (!typeInitial || sujetInitialAnnonce.current) return;

    const annoncer = () => {
      if (sujetInitialAnnonce.current) return;
      sujetInitialAnnonce.current = true;
      capture(ANALYTICS_EVENTS.rdvTypeSelected, {
        rdv_type: typeInitial,
        preselected: true,
      });
    };

    const noeud = racine.current;
    if (!noeud || typeof IntersectionObserver === "undefined") {
      annoncer();
      return;
    }

    let minuterie: ReturnType<typeof setTimeout> | undefined;
    const observateur = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((entree) => entree.isIntersecting)) return;
        observateur.disconnect();
        minuterie = setTimeout(annoncer, 500);
      },
      { threshold: 0, rootMargin: "-20% 0px -20% 0px" },
    );
    observateur.observe(noeud);
    return () => {
      observateur.disconnect();
      if (minuterie !== undefined) clearTimeout(minuterie);
    };
  }, [typeInitial]);

  useEffect(() => {
    const typeDemande = type;
    if (!typeDemande || !proche) return;
    const controleur = new AbortController();

    const parametres = new URLSearchParams({ type: typeDemande });
    if (mois) parametres.set("mois", mois);

    fetch(`/api/rendez-vous/creneaux?${parametres.toString()}`, {
      signal: controleur.signal,
    })
      .then(async (reponse) => {
        // 503 = la prise de rendez-vous n'est pas configurée. Ce n'est pas une
        // panne passagère : proposer « Réessayer » y serait mensonger.
        if (reponse.status === 503) {
          setResultat({ cle, type: typeDemande, etat: "indisponible" });
          capture(ANALYTICS_EVENTS.rdvSlotsFailed, {
            rdv_type: typeDemande,
            reason: "non_configure",
          });
          return;
        }
        if (!reponse.ok) throw new Error(String(reponse.status));
        const charge = lireReponseCreneaux(await reponse.json());
        if (!charge) throw new Error("charge_illisible");
        setResultat({ cle, type: typeDemande, etat: "aucune", donnees: charge });
        // Zéro créneau part aussi, compte à zéro : « agenda vide » n'est pas
        // « appel échoué ».
        const creneauxOfferts = charge.jours.reduce(
          (total, jour) => total + jour.creneaux.length,
          0,
        );
        capture(ANALYTICS_EVENTS.rdvSlotsLoaded, {
          rdv_type: typeDemande,
          slots_count: creneauxOfferts,
          days_count: charge.jours.length,
          duration_min: charge.duree,
        });
      })
      .catch(() => {
        // Une requête annulée n'est pas une panne : c'est nous qui l'avons
        // interrompue parce que la question a changé.
        if (controleur.signal.aborted) return;
        setResultat({ cle, type: typeDemande, etat: "reseau" });
        capture(ANALYTICS_EVENTS.rdvSlotsFailed, {
          rdv_type: typeDemande,
          reason: "reseau",
        });
      });

    return () => controleur.abort();
  }, [type, mois, cle, proche]);

  useEffect(() => {
    if (!cleSuite || !type || !moisSuivant || !proche) return;
    const controleur = new AbortController();
    const parametres = new URLSearchParams({ type, mois: moisSuivant });
    fetch(`/api/rendez-vous/creneaux?${parametres.toString()}`, { signal: controleur.signal })
      .then(async (reponse) => {
        if (!reponse.ok) return;
        const charge = lireReponseCreneaux(await reponse.json());
        // Sans le mois suivant, le calendrier reste au mois seul : pas d'erreur.
        if (charge) setSuiteBrute({ cle: cleSuite, donnees: charge });
      })
      .catch(() => {});
    return () => controleur.abort();
  }, [cleSuite, type, moisSuivant, proche]);

  const effacerEtat = () => {
    setEtatEnvoi("repos");
    setMessageEnvoi("");
    setChampEnErreur(undefined);
  };

  const choisirType = useCallback(
    (id: IdRendezVous) => {
      capture(ANALYTICS_EVENTS.rdvTypeSelected, {
        rdv_type: id,
        preselected: false,
      });
      if (id !== type) setType(id);
      setSujetChoisi(true);
      setEtatEnvoi("repos");
      setMessageEnvoi("");
    },
    [type],
  );

  /*
   * LE CRÉNEAU RETENU, avec le DÉLAI qu'il représente et non son horaire :
   * l'heure précise identifierait la personne, croisée avec l'agenda.
   */
  const choisirCreneau = useCallback(
    (choix: Creneau) => {
      const delai = Math.max(
        0,
        Math.round(
          (new Date(choix.debut).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
        ),
      );
      capture(ANALYTICS_EVENTS.rdvSlotSelected, {
        rdv_type: type,
        days_ahead: delai,
        duration_min: donnees?.duree,
      });
      setCreneau(choix);
      setEtatEnvoi("repos");
      setMessageEnvoi("");
      setChampEnErreur(undefined);
    },
    [type, donnees],
  );

  const decalerMois = useCallback(
    (decalage: number) => {
      if (!donnees) return;
      setMois(ajouterMois(donnees.fenetre.mois, decalage));
      setJourChoisi("");
    },
    [donnees],
  );

  const recommencer = useCallback(() => {
    setType(typeDepart);
    setCreneau(undefined);
    setMois("");
    setJourChoisi("");
    setEtape(0);
    refEtapeVue.current = 0;
    setEtatEnvoi("repos");
    setMessageEnvoi("");
    setChampEnErreur(undefined);
    setMessage("");
    refDebut.current = Date.now();
  }, [typeDepart]);

  /** Refus : le message s'annonce, et l'étape du champ fautif revient. */
  const refuser = (texte: string, champ: string) => {
    setEtatEnvoi("erreur");
    setMessageEnvoi(texte);
    setChampEnErreur(champ);
    const cible = ETAPE_DU_CHAMP[champ];
    if (cible !== undefined) setEtape(cible);
  };

  /** Valide l'étape affichée, puis passe à la suivante. */
  const continuer = () => {
    if (etape === 0) {
      if (!type) {
        refuser(contenu.formulaire.choisirSujet, "type");
        return;
      }
      if (!creneauRetenu) {
        refuser(contenu.formulaire.choisirHeure, "creneau");
        return;
      }
    }
    if (etape === 1 && !client && message.trim().length < SUJET_MIN) {
      refuser(contenu.formulaire.messageErreur, "message");
      return;
    }
    effacerEtat();
    setEtape((courante) => (courante < 2 ? ((courante + 1) as Etape) : courante));
  };

  const revenir = () => {
    effacerEtat();
    setEtape((courante) => (courante > 0 ? ((courante - 1) as Etape) : courante));
  };

  const gererSoumission = async (evenement: FormEvent<HTMLFormElement>) => {
    // Interdit la soumission native, donc toute donnée en chaîne de requête.
    evenement.preventDefault();
    if (etatEnvoi === "envoi") return;
    // Entrée dans un champ d'une étape intermédiaire : on avance, on n'envoie pas.
    if (etape < 2) {
      continuer();
      return;
    }
    if (!type) {
      refuser(contenu.formulaire.choisirSujet, "type");
      return;
    }
    const creneau = creneauRetenu;
    if (!creneau) {
      refuser(contenu.formulaire.choisirHeure, "creneau");
      return;
    }

    // Même lecture que le serveur : numéro requis, format plausible.
    const lecture = lireTelephone(telephone);
    if (!lecture.ok || (!lecture.valeur && !client)) {
      refuser(
        lecture.ok
          ? contenu.formulaire.telephoneErreur
          : "Ce numéro de téléphone ne semble pas valide.",
        "telephone",
      );
      return;
    }

    // Le piège à robots : un champ que seul un robot remplit, relu tel quel.
    const piege = new FormData(evenement.currentTarget).get(NOM_CHAMP_PIEGE);

    setEtatEnvoi("envoi");
    setMessageEnvoi("");
    setChampEnErreur(undefined);

    if (!protection.configure) {
      refuser(messageProtectionAbsente(emailContact), "protection");
      // Échec le plus coûteux et le plus silencieux (relevé le 2026-09-08).
      capture(ANALYTICS_EVENTS.rdvFailed, {
        rdv_type: type,
        reason: "protection_absente",
      });
      return;
    }

    const jetonCaptcha = await protection.obtenirJeton();

    try {
      const reponse = await fetch("/api/rendez-vous", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          debut: creneau.debut,
          nom,
          email,
          telephone,
          message,
          debutMs: refDebut.current,
          [NOM_CHAMP_PIEGE]: piege,
          jetonCaptcha,
          fournisseurCaptcha: protection.fournisseur,
        }),
      });
      const charge: unknown = await reponse.json().catch(() => null);

      if (reponse.ok) {
        setResumeSucces(creneau.resume);
        setEtatEnvoi("succes");
        setMessageEnvoi("");
        protection.reinitialiser();
        // LA SEULE CONVERSION QUI COMPTE, mesurée sur la réponse du serveur.
        capture(ANALYTICS_EVENTS.rdvConfirmed, {
          rdv_type: type,
          duration_min: donnees?.duree,
        });
        return;
      }

      const champ = estMessage(charge) ? charge.champ : undefined;
      refuser(
        estMessage(charge) ? charge.message : messageEchecInconnu(emailContact),
        champ ?? "",
      );
      // `field` est le NOM du champ fautif, jamais ce que le prospect y a écrit.
      capture(ANALYTICS_EVENTS.rdvFailed, {
        rdv_type: type,
        reason: "refus_serveur",
        status: reponse.status,
        field: champ ?? "inconnu",
      });
      // Créneau pris entre l'affichage et la confirmation : le calendrier se
      // recharge plutôt qu'un bouton qui échouera à l'identique.
      if (champ === "creneau") {
        setCreneau(undefined);
        setTentative((valeur) => valeur + 1);
      }
      // Le jeton est à usage unique.
      protection.reinitialiser();
    } catch {
      refuser(MESSAGE_RESEAU, "");
      protection.reinitialiser();
      capture(ANALYTICS_EVENTS.rdvFailed, {
        rdv_type: type,
        reason: "reseau",
      });
    }
  };

  if (etatEnvoi === "succes") {
    return (
      <div className="flex flex-col gap-[16px] rounded-card border border-accent bg-accent/[0.07] p-[20px]">
        <p
          ref={refSucces}
          tabIndex={-1}
          className="m-0 text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground outline-none"
        >
          {contenu.succes.titre}
        </p>
        <p className="m-0 text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
          {resumeSucces}
        </p>
        <p className={`${CLASSE_TEXTE} m-0`}>{contenu.succes.texte}</p>
        <button
          type="button"
          onClick={recommencer}
          className="mt-[4px] flex h-[50px] w-full items-center justify-center rounded-control border border-border px-[20px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none tablet:w-fit"
        >
          {contenu.succes.autre}
        </button>
      </div>
    );
  }

  const enCours = etatEnvoi === "envoi";
  const idCompteur = `${instance}-compteur`;

  /** Le créneau retenu, rappelé aux étapes 2 et 3 avec un retour au calendrier. */
  const rappelCreneau = creneauRetenu ? (
    <div className="flex items-center justify-between gap-[12px] rounded-card border border-accent/60 bg-accent/[0.07] py-[10px] pl-[16px] pr-[8px]">
      <p className="m-0 min-w-0 text-[15px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
        {typeChoisi && (pageClient || client) ? `${typeChoisi.nom} · ` : ""}
        {creneauRetenu.resume}
      </p>
      <button
        type="button"
        onClick={() => {
          effacerEtat();
          setEtape(0);
        }}
        className="min-h-[44px] shrink-0 rounded-control px-[10px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 transition-colors hover:text-accent motion-reduce:transition-none"
      >
        {contenu.etapes.modifier}
      </button>
    </div>
  ) : null;

  return (
    // `scroll-mt` : le haut du bloc ne doit pas finir sous l'en-tête fixe.
    <div ref={racine} className="flex scroll-mt-[100px] flex-col gap-[24px]">
      <form
        /* SANS CE NOM, la mesure appelle ce formulaire « form » et les
           formulaires de contact du site se confondent dans un même seau. */
        data-analytics-form="rendez-vous"
        data-etape={etape}
        className="relative flex flex-col gap-[24px]"
        /* `method="post"` et `action` : sans script, le navigateur soumet
           lui-même, en POST et dans un CORPS. */
        method="post"
        action="/api/rendez-vous"
        onSubmit={gererSoumission}
        /* Première interaction = chargement du script anti-robot. */
        onFocusCapture={protection.activer}
        noValidate
      >
        <EnteteEtape etape={etape} refTitre={refTitre} idCompteur={idCompteur} />

        {etape === 0 ? (
          <div key="etape-0" className="rdv-etape flex flex-col gap-[20px]">
            {pageClient ? (
              <BoutonsSujet
                prefixe={instance}
                types={types}
                choisi={type}
                onChoisir={choisirType}
                decrire={sujetChoisi}
              />
            ) : estTypeClient(typeInitial) ? (
              <p className="m-0 text-[18px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
                {typeChoisi?.nom}
              </p>
            ) : null}

            {!type ? <p className={`${CLASSE_TEXTE} m-0`}>{contenu.formulaire.choisirSujet}</p> : null}

            {etatCreneaux === "indisponible" ? (
              <p className={`${CLASSE_TEXTE} m-0`}>{contenu.creneaux.indisponible}</p>
            ) : null}

            {etatCreneaux === "reseau" ? (
              <div className="flex flex-col items-start gap-[12px]">
                <p className={`${CLASSE_TEXTE} m-0`}>{contenu.creneaux.erreur}</p>
                <button
                  type="button"
                  onClick={() => setTentative((valeur) => valeur + 1)}
                  className="min-h-[44px] rounded-control border border-border px-[16px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none"
                >
                  {contenu.actions.reessayer}
                </button>
              </div>
            ) : null}

            {type && !donnees && etatCreneaux === "aucune" ? (
              <div className="flex min-h-[120px] items-center gap-[10px]">
                <Spinner size="sm" label={contenu.creneaux.chargement} />
                <span aria-hidden className={CLASSE_LIBELLE}>
                  {contenu.creneaux.chargement}
                </span>
              </div>
            ) : null}

            {/* Calendrier et heures restent POSÉS pendant un rechargement
                (mois), simplement estompés : les faire disparaître déplacerait
                la grille sous le curseur du prospect. */}
            {donnees ? (
              <div className="grid grid-cols-1 gap-[24px] desktop:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
                <Calendrier
                  donnees={donnees}
                  suite={suite}
                  jourActif={jourActif}
                  chargement={chargement}
                  onChoisirJour={setJourChoisi}
                  onDecaler={decalerMois}
                />
                {jourActif ? (
                  <div
                    className={`transition-opacity motion-reduce:transition-none desktop:min-h-[230px] ${
                      chargement ? "pointer-events-none opacity-40" : ""
                    }`}
                  >
                    <Heures jour={jourActif} choisi={creneauRetenu} onChoisir={choisirCreneau} />
                  </div>
                ) : (
                  <p className={`${CLASSE_TEXTE} m-0 desktop:pt-[50px]`}>{contenu.creneaux.vide}</p>
                )}
              </div>
            ) : null}

            {donnees ? <p className={`${CLASSE_TEXTE} m-0 text-[12px]`}>{contenu.noteFuseau}</p> : null}

            {/* La région existe avant son contenu : le choix d'une heure s'annonce. */}
            <div aria-live="polite">
              {creneauRetenu ? (
                <p className="m-0 text-[15px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
                  <span className="text-foreground-60">{contenu.recapitulatif} : </span>
                  {creneauRetenu.resume}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {etape === 1 ? (
          <div key="etape-1" className="rdv-etape flex flex-col gap-[20px]">
            {rappelCreneau}
            <ChampTexte
              id={`${instance}-message`}
              nom="message"
              legende={client ? contenu.formulaire.messageLabelClient : contenu.formulaire.messageLabel}
              valeur={message}
              onChanger={setMessage}
              placeholder={client ? contenu.formulaire.messagePlaceholderClient : contenu.formulaire.messagePlaceholder}
              erreur={champEnErreur === "message" ? messageEnvoi : undefined}
              maxLength={LONGUEUR_LIGNE_MAX}
              multiligne
              legendeMasquee
              requis={!client}
            />
          </div>
        ) : null}

        {etape === 2 ? (
          <div
            key="etape-2"
            className="rdv-etape flex flex-col gap-[16px]"
            /* Première saisie (frappe ou remplissage automatique) : étape de l'entonnoir. */
            onInputCapture={() => {
              if (saisieAnnoncee.current) return;
              saisieAnnoncee.current = true;
              capture(ANALYTICS_EVENTS.rdvFormStarted, {
                rdv_type: type,
                slot_selected: creneauRetenu !== undefined,
              });
            }}
          >
            {rappelCreneau}
            <p className={`${CLASSE_TEXTE} m-0`}>{contenu.formulaire.apres}</p>
            <ChampTexte
              id={`${instance}-nom`}
              nom="nom"
              legende={contenu.formulaire.nomLabel}
              valeur={nom}
              onChanger={setNom}
              placeholder={contenu.formulaire.nomPlaceholder}
              erreur={champEnErreur === "nom" ? messageEnvoi : undefined}
              autoComplete="name"
              requis
            />
            {/* E-mail et téléphone côte à côte dès que la colonne le permet :
                l'étape tient en trois lignes au lieu de cinq. */}
            <div className="@container">
              <div className="grid grid-cols-1 gap-[16px] @md:grid-cols-2">
                <ChampTexte
                  id={`${instance}-email`}
                  nom="email"
                  type="email"
                  legende={contenu.formulaire.emailLabel}
                  valeur={email}
                  onChanger={setEmail}
                  placeholder={contenu.formulaire.emailPlaceholder}
                  erreur={champEnErreur === "email" ? messageEnvoi : undefined}
                  autoComplete="email"
                  inputMode="email"
                  requis
                />
                <ChampTexte
                  id={`${instance}-telephone`}
                  nom="telephone"
                  type="tel"
                  legende={client ? contenu.formulaire.telephoneLabelClient : contenu.formulaire.telephoneLabel}
                  aide={client ? undefined : contenu.formulaire.telephoneAide}
                  valeur={telephone}
                  onChanger={setTelephone}
                  placeholder={contenu.formulaire.telephonePlaceholder}
                  erreur={champEnErreur === "telephone" ? messageEnvoi : undefined}
                  autoComplete="tel"
                  inputMode="tel"
                  requis={!client}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-[14px]">
          {/* Au-dessus des boutons : un refus s'y lit sans chercher. Toujours
              monté, pour que l'annonce au lecteur d'écran parte. Un refus
              porté par un champ s'affiche sous ce champ, pas ici. */}
          <MessageEtat
            etat={etatEnvoi}
            message={champEnErreur && ["message", "nom", "email", "telephone"].includes(champEnErreur) ? "" : messageEnvoi}
            ton="clair"
            className="max-w-[420px]"
          />
          <div className="flex items-center justify-between gap-[12px]">
            {etape > 0 ? (
              <button type="button" onClick={revenir} className={CLASSE_BOUTON_RETOUR}>
                <Icon name="arrow" size={14} className="rotate-180" />
                {contenu.etapes.retour}
              </button>
            ) : (
              <span aria-hidden />
            )}
            {etape < 2 ? (
              <button key="continuer" type="button" onClick={continuer} className={CLASSE_BOUTON_ETAPE}>
                {contenu.etapes.continuer}
              </button>
            ) : (
              <button key="envoyer" type="submit" disabled={enCours} className={CLASSE_BOUTON_ETAPE}>
                {enCours ? contenu.formulaire.envoiEnCours : contenu.formulaire.envoyer}
              </button>
            )}
          </div>
          {etape === 2 ? (
            <>
              <p className="m-0 text-[12px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground-60">
                {contenu.formulaire.mention}{" "}
                <Link
                  href={contenu.formulaire.mentionHref}
                  className="text-foreground no-underline transition-colors duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-accent motion-reduce:transition-none"
                >
                  {contenu.formulaire.mentionLien}
                </Link>
                .
              </p>
              <MentionRecaptcha />
            </>
          ) : null}
        </div>

        {/* Toujours monté : le widget Turnstile ne survit pas à un démontage. */}
        <ChampsProtection refConteneur={protection.refConteneur} />
      </form>

      {/* Ce que montre la colonne des heures, dit au lecteur d'écran. Région
          montée en permanence : une région qui apparaît déjà remplie n'est
          pas annoncée. */}
      <p aria-live="polite" className="sr-only">
        {etape !== 0 || !type
          ? ""
          : chargement
            ? contenu.creneaux.chargement
            : etatCreneaux === "reseau"
              ? contenu.creneaux.erreur
              : jourActif
                ? contenu.creneaux.annonce(jourActif.libelle, jourActif.creneaux.length)
                : donnees
                  ? contenu.creneaux.vide
                  : ""}
      </p>
    </div>
  );
}
