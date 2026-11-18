/**
 * Pixelisation comme ÉTAT DE CHARGEMENT (voir `useDepixelisation`).
 *
 * Une image déjà là, ou qui arrive dans le délai de grâce, s'affiche nette sans
 * aucune étape. Seule une image en retard montre sa version de 32 px agrandie
 * en pixels, puis, à son arrivée, trois étapes courtes jusqu'à la version nette.
 */

/**
 * Délai de grâce, en millisecondes, entre l'entrée dans l'écran et l'attente
 * pixelisée. 200 ms couvrent une image lue depuis le cache disque ou une
 * connexion correcte, et restent sous le seuil où un cadre vide se remarque :
 * montrer des pixels pour les remplacer 50 ms plus tard serait un flash, pas
 * un état de chargement.
 */
export const DELAI_GRACE = 200;

/**
 * Largeur servie par l'optimiseur pour l'attente, quand l'image n'est pas
 * encore arrivée. Prise dans les `imageSizes` par défaut de Next 16 : une autre
 * largeur serait refusée par `/_next/image`.
 */
export const LARGEUR_ATTENTE = 32;

/**
 * Étapes jouées à l'arrivée de l'image en retard, au-dessus de l'attente en
 * 32 colonnes : jamais de recul vers plus grossier.
 */
export const ETAPES_ARRIVEE = [48, 96, 128] as const;

/** Durée de chaque étape d'arrivée : 180 ms en tout jusqu'à l'image nette. */
export const DUREE_ETAPE = 60;

/**
 * Taille de la miniature pour `colonnes` colonnes, au rapport de l'image.
 * Jamais sous un pixel ; rapport inconnu (image vide) : carré.
 */
export function tailleMiniature(
  colonnes: number,
  largeur: number,
  hauteur: number,
): { largeur: number; hauteur: number } {
  const rapport = largeur > 0 && hauteur > 0 ? hauteur / largeur : 1;
  return { largeur: colonnes, hauteur: Math.max(1, Math.round(colonnes * rapport)) };
}

/**
 * Largeur affichée sous laquelle on ne pixelise pas : avatars, logos,
 * vignettes. À cette taille, quelques colonnes ne se lisent pas comme une image.
 */
export const LARGEUR_MIN_EFFET = 80;

/** Ce qui tient lieu d'image : l'attente en 32 px, ou une étape d'arrivée. */
export type Etape<I> =
  | { type: "attente" }
  | { type: "arrivee"; img: I; colonnes: number };

/**
 * Déroulé du chargement d'une image, sans DOM ni minuterie propres (injectés,
 * pour les tests). Rend `"nette"` quand rien de pixelisé n'a été montré,
 * `"attente"` sinon.
 *
 * - `estChargee()` vrai : rien.
 * - Image arrivée (ou en échec) dans `grace` ms : rien.
 * - Sinon : `montrer({ type: "attente" })`, puis à l'arrivée les étapes de
 *   `ETAPES_ARRIVEE`, puis `montrer(null)`. Une étape qui lève (toile illisible)
 *   coupe court à l'image nette.
 */
export async function deroulerChargement<I>({
  estChargee,
  charger,
  attendre,
  montrer,
  estAnnule,
  grace = DELAI_GRACE,
}: {
  estChargee: () => boolean;
  charger: () => Promise<I | null>;
  attendre: (ms: number) => Promise<void>;
  montrer: (etape: Etape<I> | null) => void;
  estAnnule: () => boolean;
  grace?: number;
}): Promise<"nette" | "attente"> {
  if (estChargee()) return "nette";
  const arrivee = charger();
  const aTemps = await Promise.race([
    arrivee.then(() => true),
    attendre(grace).then(() => false),
  ]);
  if (aTemps || estAnnule()) return "nette";

  montrer({ type: "attente" });
  const img = await arrivee;
  try {
    if (img !== null) {
      for (const colonnes of ETAPES_ARRIVEE) {
        if (estAnnule()) break;
        montrer({ type: "arrivee", img, colonnes });
        await attendre(DUREE_ETAPE);
      }
    }
  } catch {
    // Toile illisible (image d'une autre origine) : on montre l'image nette.
  }
  if (!estAnnule()) montrer(null);
  return "attente";
}
