"use client";

import { useMemo } from "react";
import { CLE_RECAPTCHA, useProtectionRecaptcha } from "./recaptcha";
import { useProtectionTurnstile } from "./turnstile";
import type { ProtectionTurnstile } from "./turnstile";

/**
 * La protection anti-robot des formulaires, quel que soit le fournisseur.
 *
 * reCAPTCHA v3 dès que `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` existe : rien à cocher.
 * Sans elle, Turnstile en mode `interaction-only` reste en place, invisible
 * sauf doute : le site n'est jamais sans protection le temps que les clefs
 * Google soient posées. Le fournisseur part avec le jeton
 * (`fournisseurCaptcha`) : le serveur vérifie auprès du bon service.
 */
export type FournisseurCaptcha = "recaptcha" | "turnstile";

export interface ProtectionFormulaire extends ProtectionTurnstile {
  readonly fournisseur: FournisseurCaptcha;
}

export const RECAPTCHA_ACTIF = CLE_RECAPTCHA.length > 0;

export function useProtectionFormulaire(action: string): ProtectionFormulaire {
  const turnstile = useProtectionTurnstile();
  const recaptcha = useProtectionRecaptcha(action);
  return useMemo<ProtectionFormulaire>(
    () =>
      RECAPTCHA_ACTIF
        ? {
            fournisseur: "recaptcha",
            configure: true,
            // Le conteneur Turnstile reste monté, vide et masqué.
            refConteneur: turnstile.refConteneur,
            activer: recaptcha.activer,
            obtenirJeton: recaptcha.obtenirJeton,
            // Chaque envoi demande un jeton neuf : rien à remettre à zéro.
            reinitialiser: () => {},
          }
        : { ...turnstile, fournisseur: "turnstile" },
    [turnstile, recaptcha],
  );
}
