"use client";

import { useCallback } from "react";

/**
 * Google reCAPTCHA v3, demandé par Eliott le 2026-11-24 : la case Turnstile
 * apparaissait sous le bouton chez trop de visiteurs. v3 ne montre rien, ni
 * case ni image : il rend un jeton que le serveur échange contre un score.
 *
 * CHARGEMENT PARESSEUX, comme Turnstile : le script Google n'est demandé qu'à
 * la première interaction avec un formulaire (`activer`, sur `onFocusCapture`)
 * ou au moment de l'envoi. Un visiteur qui ne touche à rien ne contacte jamais
 * Google.
 *
 * LE BADGE EST MASQUÉ (`.grecaptcha-badge` dans `globals.css`) et la mention
 * exigée par Google s'affiche sous le bouton d'envoi (`mentionRecaptcha`).
 */

interface ApiRecaptcha {
  ready(rappel: () => void): void;
  execute(cle: string, options: { action: string }): Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: ApiRecaptcha;
  }
}

/** Clef publique. Absente = Turnstile reste en place (`useProtectionFormulaire`). */
export const CLE_RECAPTCHA = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ?? "";

let chargement: Promise<ApiRecaptcha> | undefined;

function chargerScript(): Promise<ApiRecaptcha> {
  if (chargement) return chargement;
  chargement = new Promise<ApiRecaptcha>((resoudre, rejeter) => {
    const pret = () => {
      const api = window.grecaptcha;
      if (!api) {
        rejeter(new Error("recaptcha absent"));
        return;
      }
      api.ready(() => resoudre(api));
    };
    if (window.grecaptcha) {
      pret();
      return;
    }
    const balise = document.createElement("script");
    balise.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(CLE_RECAPTCHA)}&hl=fr`;
    balise.async = true;
    balise.addEventListener("load", pret);
    balise.addEventListener("error", () => {
      // Oubliée pour qu'une coupure passagère ne condamne pas le formulaire.
      chargement = undefined;
      rejeter(new Error("script recaptcha indisponible"));
    });
    document.head.appendChild(balise);
  });
  return chargement;
}

export interface ProtectionRecaptcha {
  readonly configure: boolean;
  activer: () => void;
  obtenirJeton: () => Promise<string | undefined>;
}

/**
 * @param action Nom de l'action vérifié par le serveur (`contact`,
 *   `rendez_vous`, `estimation`) : un jeton pris pour un formulaire ne vaut
 *   pas pour un autre.
 */
export function useProtectionRecaptcha(action: string): ProtectionRecaptcha {
  const activer = useCallback(() => {
    if (!CLE_RECAPTCHA) return;
    chargerScript().catch(() => {
      // L'envoi retentera ; à défaut, le serveur refuse proprement (403).
    });
  }, []);

  const obtenirJeton = useCallback(async (): Promise<string | undefined> => {
    if (!CLE_RECAPTCHA) return undefined;
    try {
      const api = await chargerScript();
      // Un jeton v3 vit deux minutes : il se prend au moment de l'envoi.
      return await api.execute(CLE_RECAPTCHA, { action });
    } catch {
      return undefined;
    }
  }, [action]);

  return { configure: CLE_RECAPTCHA.length > 0, activer, obtenirJeton };
}
