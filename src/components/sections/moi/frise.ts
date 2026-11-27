import type { ParcoursEtape } from "@/lib/content/types";

/**
 * GÉOMÉTRIE DE LA FRISE DU PARCOURS, sans React : un axe des années, deux
 * lignes (formation au-dessus, expérience en dessous), chaque étape placée au
 * mois près. Les positions sont des fractions de la piste, la largeur réelle
 * vient du CSS (une année = `--an`).
 */

export type Ligne = "formation" | "experience";

export interface EtapePlacee {
  etape: ParcoursEtape;
  ligne: Ligne;
  /** Début et fin en fraction de la piste (0 à 1). */
  debut: number;
  fin: number;
  /** Étape sans date de fin : elle court jusqu'au bout de la piste. */
  enCours: boolean;
  /** Rang de la carte dans sa ligne, pour que deux cartes proches ne se chevauchent pas. */
  rang: number;
}

/**
 * Largeur d'une carte, marge comprise, en années : 224 px pour 480 px par an
 * sur ordinateur, 204 pour 440 ailleurs. Sous un demi-an, deux étapes à six
 * mois d'écart (Würth puis MeilleursBiens) tiennent sur une seule rangée.
 */
const LARGEUR_CARTE_ANS = 0.49;

/** « 2024-09 » → 2024,666… ; `null` si la date manque ou ne se lit pas. */
export function moisEnAnnee(mois: string | undefined): number | null {
  const m = /^(\d{4})-(\d{2})$/.exec(mois ?? "");
  if (!m) return null;
  return Number(m[1]) + (Number(m[2]) - 1) / 12;
}

/**
 * Bornes de l'axe : la première année entière d'une étape, jusqu'à l'année
 * qui suit `aujourdhui`.
 */
export function bornes(etapes: readonly ParcoursEtape[], aujourdhui: number): { de: number; a: number } {
  const debuts = etapes.map((e) => moisEnAnnee(e.debut)).filter((v): v is number => v !== null);
  const de = Math.floor(Math.min(aujourdhui, ...debuts));
  return { de, a: Math.floor(aujourdhui) + 1 };
}

export function placer(
  groupes: readonly { ligne: Ligne; etapes: readonly ParcoursEtape[] }[],
  aujourdhui: number,
): { etapes: EtapePlacee[]; de: number; a: number } {
  const toutes = groupes.flatMap((g) => g.etapes);
  const { de, a } = bornes(toutes, aujourdhui);
  const fraction = (an: number) => (an - de) / (a - de);
  const placees: EtapePlacee[] = [];
  for (const { ligne, etapes } of groupes) {
    const fins: number[] = [];
    const datees = etapes
      .map((etape) => ({ etape, d: moisEnAnnee(etape.debut), f: moisEnAnnee(etape.fin) }))
      .filter((x): x is { etape: ParcoursEtape; d: number; f: number | null } => x.d !== null)
      .sort((x, y) => x.d - y.d);
    for (const { etape, d, f } of datees) {
      const debut = fraction(d);
      let rang = fins.findIndex((fin) => fin <= debut);
      if (rang === -1) rang = fins.length;
      fins[rang] = debut + fraction(de + LARGEUR_CARTE_ANS);
      placees.push({ etape, ligne, debut, fin: f === null ? 1 : fraction(f), enCours: f === null, rang });
    }
  }
  return { etapes: placees, de, a };
}

/** Position de « aujourd'hui » sur la piste. */
export function positionAujourdhui(de: number, a: number, aujourdhui: number): number {
  return (aujourdhui - de) / (a - de);
}
