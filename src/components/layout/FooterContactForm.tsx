"use client";

/**
 * Formulaire du pied de page — composant CLIENT.
 *
 * IL ÉTAIT DÉCORATIF, et le code le disait : « formulaire (statique, sans
 * backend) ». Aucun `action`, aucun `onSubmit`, onze champs pièges que personne
 * ne lisait. Il est présent sur les NEUF routes du site : c'est le formulaire
 * le plus vu, et c'était celui qui ne menait nulle part.
 *
 * IL N'A PAS ÉTÉ RETIRÉ, il a été branché. Ce n'est pas une inscription à une
 * lettre d'information — les champs demandent un nom, une adresse et un type de
 * projet —, c'est une demande de contact. Elle part donc sur la MÊME route que
 * `/contact`, avec l'intention `footer`, qui la distingue dans la boîte
 * d'Eliott sans dupliquer une ligne de serveur.
 *
 * NÉOMORPHISME depuis le 2026-11-02 (maquette validée par Eliott) : la carte,
 * les champs et les boutons sont dessinés par les classes `.neo-*` de
 * `globals.css`.
 *
 * UN SEUL ÉCRAN DEPUIS LE 2026-11-24 (Eliott trouvait le bloc pénible) : le
 * message d'abord, puis nom, e-mail et téléphone facultatif, et un bouton
 * « Envoyer le message ». Plus de questionnaire en trois étapes : qui veut
 * cadrer son projet réserve un appel, l'onglet d'à côté. Chaque erreur
 * s'écrit sous son champ, avant tout envoi.
 */

import { SwapCopies } from "@/components/ui/SwapCopies";
import { HoverPrefetchLink } from "@/components/ui/HoverPrefetchLink";
import {
  ChampsProtection,
  MentionRecaptcha,
  MessageEtat,
  ReplisSansScript,
} from "@/components/forms/ProtectionFormulaire";
import { useEnvoiFormulaire } from "@/components/forms/useEnvoiFormulaire";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { lireTelephone, LIMITES, MOTIF_EMAIL } from "@/lib/contact/validation";
import type { SiteConfig } from "@/lib/content/types";

/** Le pied de page ne rend ce composant que si la donnée existe. */
type FooterFormContent = NonNullable<SiteConfig["footerForm"]>;

/** Libellé de champ : à gauche, au-dessus, en capitales 13 px. */
const LIBELLE_CLS =
  "text-left text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground";

/**
 * Dessin commun des champs en creux. Le contour à 40 % de blanc tient 3,8:1
 * sur la matière de la carte (`#131313`), au-dessus des 3:1 de WCAG 1.4.11 ;
 * le survol monte d'un cran. La couleur d'état (vérifié, refusé) est portée
 * par `.neo-champ` selon `data-etat` et `aria-invalid`.
 */
const CHAMP_CLS =
  "neo-champ w-full border border-white/40 px-[18px] text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground placeholder:text-white/50 hover:border-white/60 focus:border-accent";

/** Une adresse qu'on peut écrire : quelque chose, une arobase, un domaine à point. */
const FORME_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type EtatEmail = "repos" | "valide" | "refuse";

/**
 * État d'une adresse à la sortie du champ : rien tant qu'elle est vide, vert
 * quand le navigateur l'accepte ET qu'elle a un domaine à point (le navigateur
 * laisse passer `nom@domaine`), rouge sinon.
 */
export function etatAdresse(valeur: string, accepteeParLeNavigateur: boolean): EtatEmail {
  const adresse = valeur.trim();
  if (adresse.length === 0) return "repos";
  return accepteeParLeNavigateur && FORME_EMAIL.test(adresse) ? "valide" : "refuse";
}

/** Champ de saisie en creux, libellé au-dessus. */
function FormField({
  label,
  type,
  name,
  placeholder,
  autoComplete,
  enErreur = false,
  requis = true,
  inputMode,
  etat,
  aide,
  onBlur,
  onInput,
}: {
  label: string;
  type: string;
  /** Nom attendu par `POST /api/contact` (`nom`, `email`). */
  name: string;
  placeholder: string;
  autoComplete?: string;
  /** Surligne le champ que le serveur, ou la vérification locale, a refusé. */
  enErreur?: boolean;
  /** Faux pour un champ facultatif (le téléphone). */
  requis?: boolean;
  inputMode?: "tel";
  /** Contour vert quand la saisie a été vérifiée. */
  etat?: EtatEmail;
  /** Ligne d'aide sous le champ, réservée même vide pour ne rien décaler. */
  aide?: string;
  onBlur?: (champ: HTMLInputElement) => void;
  onInput?: (champ: HTMLInputElement) => void;
}) {
  const id = useId();
  return (
    <div className="flex w-full flex-col gap-[10px]">
      <label htmlFor={id} className={LIBELLE_CLS}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        required={requis}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={enErreur || undefined}
        aria-describedby={aide !== undefined ? `${id}-aide` : undefined}
        data-etat={etat === "valide" ? "valide" : undefined}
        onBlur={onBlur ? (evenement) => onBlur(evenement.currentTarget) : undefined}
        onInput={onInput ? (evenement) => onInput(evenement.currentTarget) : undefined}
        className={`${CHAMP_CLS} h-[54px]`}
      />
      {aide !== undefined ? (
        <p id={`${id}-aide`} aria-live="polite" className="neo-aide m-0 text-[13px] leading-[1.3] empty:hidden">
          {aide}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Bouton principal, volt, en relief : il s'enfonce au clic. Le texte permute
 * verticalement au survol (`SwapCopies`), comme les autres boutons du site.
 */
function SubmitButton({
  label,
  enCours = false,
  onClick,
}: {
  label: string;
  enCours?: boolean;
  /** Présent = bouton « Continuer » d'une étape, qui n'envoie rien. */
  onClick?: () => void;
}) {
  // `leading-[1.2]` et non `leading-[16px]` : le cadre clippant de la source
  // mesure 15,59 px (13 px × 1,2), le nôtre en mesurait 16.
  const textCls =
    "text-[13px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink";
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={enCours}
      className="neo-bouton neo-bouton--principal group relative flex h-[52px] flex-none items-center justify-center px-[28px] disabled:cursor-progress disabled:opacity-60"
    >
      <span className="relative block h-[15.6px] overflow-hidden">
        <SwapCopies travel={12} textClassName={textCls}>
          {enCours ? "Envoi…" : label}
        </SwapCopies>
      </span>
    </button>
  );
}

/** Zone de message, en creux comme les autres champs, erreur dessous. */
function FieldTexte({
  label,
  placeholder,
  erreur,
  onInput,
}: {
  label: string;
  placeholder: string;
  erreur: string;
  onInput: () => void;
}) {
  const id = useId();
  return (
    <div className="flex w-full flex-col gap-[10px]">
      <label htmlFor={id} className={LIBELLE_CLS}>
        {label}
      </label>
      <textarea
        id={id}
        name="message"
        rows={4}
        required
        maxLength={LIMITES.message.max}
        placeholder={placeholder}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={`${id}-aide`}
        onInput={onInput}
        className={`${CHAMP_CLS} block min-h-[128px] resize-y py-[15px]`}
      />
      <p id={`${id}-aide`} aria-live="polite" className="neo-aide m-0 text-[13px] leading-[1.3] empty:hidden">
        {erreur}
      </p>
    </div>
  );
}

/** Erreurs locales, par champ : vides tant que rien n'est refusé. */
type ErreursLocales = Partial<Record<"message" | "nom" | "telephone", string>>;

export function FooterContactForm({
  footerForm,
  emailContact,
  inlineLinkCls,
}: {
  footerForm: FooterFormContent;
  /** Adresse publiée, affichée en repli quand l'envoi ne peut pas aboutir. */
  emailContact: string;
  /** Classe des liens en ligne, définie une seule fois dans `Footer.tsx`. */
  inlineLinkCls: string;
}) {
  const envoi = useEnvoiFormulaire("footer", emailContact);
  // L'adresse est vérifiée à la sortie du champ, pas à chaque frappe.
  const [etatEmail, setEtatEmail] = useState<EtatEmail>("repos");
  const [erreurs, setErreurs] = useState<ErreursLocales>({});
  const textes = footerForm.erreurs;

  function verifierEmail(champ: HTMLInputElement) {
    setEtatEmail(etatAdresse(champ.value, champ.checkValidity()));
  }

  /** Une erreur s'efface dès que le visiteur reprend le champ. */
  function effacer(champ: keyof ErreursLocales) {
    if (erreurs[champ]) setErreurs((courantes) => ({ ...courantes, [champ]: undefined }));
  }

  /**
   * Contrôle local, mêmes règles que le serveur, avant tout envoi : chaque
   * refus s'écrit sous son champ et le premier champ fautif prend le focus.
   */
  function soumettre(evenement: FormEvent<HTMLFormElement>) {
    const formulaire = evenement.currentTarget;
    const lire = (nom: string) => {
      const valeur = new FormData(formulaire).get(nom);
      return typeof valeur === "string" ? valeur.trim() : "";
    };
    const email = lire("email");
    const nouvelles: ErreursLocales = {};
    if (lire("message").length < LIMITES.message.min) nouvelles.message = textes.message;
    if (lire("nom").length < LIMITES.nom.min) nouvelles.nom = textes.nom;
    if (!lireTelephone(lire("telephone")).ok) nouvelles.telephone = textes.telephone;
    const emailRefuse = !MOTIF_EMAIL.test(email);
    if (emailRefuse) setEtatEmail("refuse");
    if (Object.keys(nouvelles).length > 0 || emailRefuse) {
      evenement.preventDefault();
      setErreurs(nouvelles);
      const premier = (["message", "nom", "email", "telephone"] as const).find((nom) =>
        nom === "email" ? emailRefuse : nouvelles[nom] !== undefined,
      );
      if (premier) formulaire.querySelector<HTMLElement>(`[name="${premier}"]`)?.focus();
      return;
    }
    setErreurs({});
    void envoi.gererSoumission(evenement);
  }

  return (
    <form
      className="relative flex w-full flex-col items-start gap-[20px]"
      /* Voir `ReplisSansScript` : en POST, jamais en GET, pour qu'une
         soumission sans script ne remonte pas les données dans l'URL. */
      method="post"
      action="/api/contact"
      noValidate
      onSubmit={soumettre}
      onReset={() => {
        setEtatEmail("repos");
        setErreurs({});
      }}
      onFocusCapture={envoi.protection.activer}
    >
      <FieldTexte
        label={footerForm.messageLabel ?? ""}
        placeholder={footerForm.messagePlaceholder ?? ""}
        erreur={erreurs.message ?? (envoi.champEnErreur === "message" ? envoi.message : "")}
        onInput={() => effacer("message")}
      />
      <div className="neo-duo w-full">
        <FormField
          label={footerForm.nameLabel}
          type="text"
          name="nom"
          autoComplete="name"
          placeholder={footerForm.namePlaceholder ?? ""}
          enErreur={envoi.champEnErreur === "nom" || erreurs.nom !== undefined}
          aide={erreurs.nom ?? (envoi.champEnErreur === "nom" ? envoi.message : "")}
          onInput={() => effacer("nom")}
        />
        <FormField
          label={footerForm.emailLabel}
          /* `type="email"` : le clavier des téléphones bascule sur la
             disposition adaptée. */
          type="email"
          name="email"
          autoComplete="email"
          placeholder={footerForm.emailPlaceholder ?? ""}
          enErreur={envoi.champEnErreur === "email" || etatEmail === "refuse"}
          etat={etatEmail}
          aide={etatEmail === "refuse" ? (footerForm.emailInvalide ?? "") : ""}
          onBlur={verifierEmail}
          // Une adresse refusée se revérifie à la frappe : le rouge part dès
          // qu'elle est juste, sans attendre de quitter le champ.
          onInput={etatEmail === "refuse" ? verifierEmail : undefined}
        />
      </div>
      {footerForm.telephoneLabel ? (
        <FormField
          label={footerForm.telephoneLabel}
          type="tel"
          name="telephone"
          autoComplete="tel"
          inputMode="tel"
          requis={false}
          placeholder={footerForm.telephonePlaceholder ?? ""}
          enErreur={envoi.champEnErreur === "telephone" || erreurs.telephone !== undefined}
          aide={erreurs.telephone ?? (envoi.champEnErreur === "telephone" ? envoi.message : "")}
          onInput={() => effacer("telephone")}
        />
      ) : null}

      <div className="flex w-full flex-col gap-[16px]">
        {/* État d'envoi, annoncé aussi aux lecteurs d'écran. */}
        <MessageEtat etat={envoi.etat} message={envoi.message} ton="clair" className="max-w-[420px]" />
        <SubmitButton label={footerForm.submitLabel} enCours={envoi.etat === "envoi"} />
        <p className="m-0 w-full text-[12px] font-medium leading-[1.45] tracking-[-0.01em] text-foreground-60">
          {/* Les trois morceaux de phrase encadrant les deux liens
              viennent de la donnée (`disclaimerPrefix` / `Joiner` /
              `Suffix`). */}
          {footerForm.disclaimerPrefix}
          {footerForm.disclaimerLinks?.[0] ? (
            <HoverPrefetchLink href={footerForm.disclaimerLinks[0].href} className={inlineLinkCls}>
              {footerForm.disclaimerLinks[0].label}
            </HoverPrefetchLink>
          ) : null}{" "}
          {footerForm.disclaimerJoiner}
          {footerForm.disclaimerLinks?.[1] ? (
            <HoverPrefetchLink href={footerForm.disclaimerLinks[1].href} className={inlineLinkCls}>
              {footerForm.disclaimerLinks[1].label}
            </HoverPrefetchLink>
          ) : null}
          {footerForm.disclaimerSuffix}
        </p>
        <MentionRecaptcha />
      </div>

      {/* Un seul champ piège suffit dès lors qu'il est VÉRIFIÉ : voir
          `ChampsProtection`. */}
      <ReplisSansScript emailContact={emailContact} />
      <ChampsProtection refConteneur={envoi.protection.refConteneur} />
    </form>
  );
}
