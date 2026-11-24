/**
 * Vérification du jeton anti-robot, derrière une interface.
 *
 * DEUX FOURNISSEURS DEPUIS LE 2026-11-24. Eliott veut Google reCAPTCHA v3 :
 * la case Turnstile apparaissait sous le bouton chez trop de visiteurs. v3 ne
 * montre rien et rend un score, comparé ici à `SEUIL_RECAPTCHA`. Turnstile
 * reste en repli tant que `RECAPTCHA_SECRET_KEY` manque : jamais un formulaire
 * sans protection le temps que les clefs Google soient posées.
 *
 * Le navigateur dit avec quel fournisseur il a pris son jeton
 * (`fournisseurCaptcha`) ; le serveur suit ce choix s'il en a la clef secrète,
 * sinon il prend celui qu'il sait vérifier. Pendant un déploiement où une seule
 * des deux clefs reCAPTCHA serait posée, le jeton reste ainsi vérifiable.
 *
 * CONSENTEMENT. reCAPTCHA charge un script Google qui lit des signaux du
 * navigateur. Il n'est chargé qu'à la première interaction avec un formulaire,
 * et la politique de confidentialité le nomme (`src/content/legal.ts`).
 *
 * ABSENCE DE CLEF = REFUS EXPLICITE, jamais un laissez-passer. Un formulaire
 * qui accepte tout parce qu'une variable d'environnement manque est le pire des
 * deux mondes : il a l'air protégé et ne l'est pas.
 */

/** Issue d'une vérification. Le détail reste au serveur. */
export type ResultatCaptcha =
  | { readonly ok: true }
  | {
      readonly ok: false;
      /**
       * `non_configure` : clefs absentes, le service refuse de servir.
       * `jeton_absent` : le client n'a envoyé aucun jeton.
       * `jeton_refuse` : le fournisseur a répondu « non », ou le score est
       *   sous le seuil, ou l'action ne correspond pas au formulaire.
       * `indisponible` : le fournisseur n'a pas répondu (réseau, panne).
       */
      readonly raison: "non_configure" | "jeton_absent" | "jeton_refuse" | "indisponible";
      /** Codes bruts du fournisseur, pour le journal serveur uniquement. */
      readonly codes?: readonly string[];
    };

export interface VerificateurCaptcha {
  /** Nom du fournisseur, journalisé au démarrage et en cas d'erreur. */
  readonly nom: string;
  verifier(jeton: string | undefined, adresse: string | undefined): Promise<ResultatCaptcha>;
}

const URL_TURNSTILE =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Forme utile de la réponse Cloudflare. Le reste est ignoré. */
interface ReponseTurnstile {
  success: boolean;
  "error-codes"?: string[];
}

function litReponseTurnstile(charge: unknown): ReponseTurnstile | undefined {
  if (typeof charge !== "object" || charge === null) return undefined;
  const objet = charge as Record<string, unknown>;
  if (typeof objet.success !== "boolean") return undefined;
  const codes = objet["error-codes"];
  return {
    success: objet.success,
    "error-codes": Array.isArray(codes)
      ? codes.filter((c): c is string => typeof c === "string")
      : undefined,
  };
}

export function creerVerificateurTurnstile(
  cleSecrete: string,
): VerificateurCaptcha {
  return {
    nom: "turnstile",
    async verifier(jeton, adresse) {
      if (!jeton || jeton.trim().length === 0) {
        return { ok: false, raison: "jeton_absent" };
      }

      const corps = new FormData();
      corps.append("secret", cleSecrete);
      corps.append("response", jeton);
      // L'adresse aide Cloudflare à noter la requête. Omise si inconnue :
      // envoyer notre repli `sans-adresse` ferait échouer la vérification.
      if (adresse && adresse !== "sans-adresse") {
        corps.append("remoteip", adresse);
      }

      try {
        const reponse = await fetch(URL_TURNSTILE, {
          method: "POST",
          body: corps,
          // Sans délai maximal, une panne réseau chez Cloudflare tiendrait la
          // requête ouverte jusqu'au délai de la plateforme (souvent 30 s) et
          // le prospect regarderait un bouton qui tourne.
          signal: AbortSignal.timeout(8_000),
        });
        if (!reponse.ok) {
          return { ok: false, raison: "indisponible", codes: [String(reponse.status)] };
        }
        const analyse = litReponseTurnstile(await reponse.json());
        if (!analyse) return { ok: false, raison: "indisponible" };
        if (analyse.success) return { ok: true };
        return {
          ok: false,
          raison: "jeton_refuse",
          codes: analyse["error-codes"],
        };
      } catch {
        return { ok: false, raison: "indisponible" };
      }
    },
  };
}

/**
 * Vérificateur de repli quand aucune clef n'est configurée.
 *
 * Il refuse TOUT. La route traduit ce refus en 503 et en un message honnête
 * (« le formulaire est momentanément indisponible, écrivez-moi directement »),
 * ce qui est la seule sortie acceptable : la solution alternative, laisser
 * passer, ouvre la boîte d'Eliott à n'importe quel robot le jour où une
 * variable d'environnement saute au déploiement.
 */
export const VERIFICATEUR_ABSENT: VerificateurCaptcha = {
  nom: "aucun",
  async verifier() {
    return { ok: false, raison: "non_configure" };
  },
};

const URL_RECAPTCHA = "https://www.google.com/recaptcha/api/siteverify";

/**
 * Score minimal accepté, de 0 (robot) à 1 (humain). 0,5 est la valeur que
 * Google recommande pour démarrer ; `RECAPTCHA_SEUIL` l'ajuste sans
 * redéploiement de code si les journaux montrent des refus d'humains.
 */
export const SEUIL_RECAPTCHA = 0.5;

interface ReponseRecaptcha {
  readonly success: boolean;
  readonly score?: number;
  readonly action?: string;
  readonly codes: readonly string[];
}

function litReponseRecaptcha(charge: unknown): ReponseRecaptcha | undefined {
  if (typeof charge !== "object" || charge === null) return undefined;
  const objet = charge as Record<string, unknown>;
  if (typeof objet.success !== "boolean") return undefined;
  const codes = objet["error-codes"];
  return {
    success: objet.success,
    ...(typeof objet.score === "number" ? { score: objet.score } : {}),
    ...(typeof objet.action === "string" ? { action: objet.action } : {}),
    codes: Array.isArray(codes) ? codes.filter((c): c is string => typeof c === "string") : [],
  };
}

export function creerVerificateurRecaptcha(
  cleSecrete: string,
  options: { readonly seuil?: number; readonly action?: string } = {},
): VerificateurCaptcha {
  const seuil = options.seuil ?? SEUIL_RECAPTCHA;
  return {
    nom: "recaptcha",
    async verifier(jeton, adresse) {
      if (!jeton || jeton.trim().length === 0) {
        return { ok: false, raison: "jeton_absent" };
      }
      const corps = new URLSearchParams({ secret: cleSecrete, response: jeton });
      if (adresse && adresse !== "sans-adresse") corps.set("remoteip", adresse);
      try {
        const reponse = await fetch(URL_RECAPTCHA, {
          method: "POST",
          body: corps,
          signal: AbortSignal.timeout(8_000),
        });
        if (!reponse.ok) {
          return { ok: false, raison: "indisponible", codes: [String(reponse.status)] };
        }
        const analyse = litReponseRecaptcha(await reponse.json());
        if (!analyse) return { ok: false, raison: "indisponible" };
        if (!analyse.success) {
          return { ok: false, raison: "jeton_refuse", codes: analyse.codes };
        }
        if (options.action && analyse.action !== options.action) {
          return { ok: false, raison: "jeton_refuse", codes: [`action:${analyse.action ?? ""}`] };
        }
        if (analyse.score === undefined || analyse.score < seuil) {
          return { ok: false, raison: "jeton_refuse", codes: [`score:${analyse.score ?? "absent"}`] };
        }
        return { ok: true };
      } catch {
        return { ok: false, raison: "indisponible" };
      }
    },
  };
}

/** Lit le seuil de l'environnement ; une valeur hors de ]0, 1] garde le défaut. */
export function lireSeuil(brut: string | undefined): number {
  const valeur = Number(brut);
  return brut && Number.isFinite(valeur) && valeur > 0 && valeur <= 1 ? valeur : SEUIL_RECAPTCHA;
}

/** Le fournisseur annoncé par le navigateur, ou `undefined`. */
export function lireFournisseur(corps: unknown): "recaptcha" | "turnstile" | undefined {
  if (typeof corps !== "object" || corps === null) return undefined;
  const valeur = (corps as Record<string, unknown>).fournisseurCaptcha;
  return valeur === "recaptcha" || valeur === "turnstile" ? valeur : undefined;
}

/**
 * Choisit le vérificateur à partir de l'environnement et du fournisseur
 * annoncé par le navigateur.
 *
 * Lu à chaque appel et non au chargement du module : en développement, poser la
 * clef puis relancer le serveur suffit, sans avoir à raisonner sur l'ordre
 * d'évaluation des modules.
 *
 * @param demande `fournisseur` : celui du jeton ; `action` : celle que le
 *   jeton reCAPTCHA doit porter (`contact`, `rendez_vous`, `estimation`).
 */
export function resoudreVerificateur(
  demande: { readonly fournisseur?: "recaptcha" | "turnstile"; readonly action?: string } = {},
  env: Readonly<Record<string, string | undefined>> = process.env,
): VerificateurCaptcha {
  const recaptcha = env.RECAPTCHA_SECRET_KEY?.trim();
  const turnstile = env.TURNSTILE_SECRET_KEY?.trim();
  const versRecaptcha = (cle: string) =>
    creerVerificateurRecaptcha(cle, {
      seuil: lireSeuil(env.RECAPTCHA_SEUIL),
      ...(demande.action ? { action: demande.action } : {}),
    });
  if (demande.fournisseur === "recaptcha" && recaptcha) return versRecaptcha(recaptcha);
  if (demande.fournisseur === "turnstile" && turnstile) return creerVerificateurTurnstile(turnstile);
  if (recaptcha) return versRecaptcha(recaptcha);
  if (turnstile) return creerVerificateurTurnstile(turnstile);
  return VERIFICATEUR_ABSENT;
}
