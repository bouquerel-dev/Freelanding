/**
 * Géométrie des étincelles au clic, sans DOM : testable et partagée par
 * `EtincellesClic`. Réécriture légère du « Click Spark » de reactbits.dev :
 * huit traits partent du point cliqué, s'allongent puis se raccourcissent en
 * s'éloignant, sur 400 ms en ease-out.
 */
export const ETINCELLES = Object.freeze({
  nombre: 8,
  /** Longueur maximale d'un trait, en px CSS. */
  taille: 10,
  /** Distance parcourue par le pied du trait, en px CSS. */
  rayon: 18,
  dureeMs: 400,
  epaisseur: 1.5,
});

/** Ease-out cubique : départ vif, arrivée douce. */
export function easeOut(t: number): number {
  const borne = Math.min(Math.max(t, 0), 1);
  return 1 - (1 - borne) ** 3;
}

export type Trait = { x1: number; y1: number; x2: number; y2: number };

/**
 * Les traits d'un clic à `ecouleMs` de son départ, ou `null` quand l'éclat est
 * fini. Les traits sortent tous ensemble : le décalage d'angle d'un demi-pas
 * évite qu'un trait pointe pile vers le haut, sur l'axe du curseur.
 */
export function traitsAuTemps(x: number, y: number, ecouleMs: number): Trait[] | null {
  if (ecouleMs < 0 || ecouleMs >= ETINCELLES.dureeMs) return null;
  const p = easeOut(ecouleMs / ETINCELLES.dureeMs);
  const distance = p * ETINCELLES.rayon;
  const longueur = ETINCELLES.taille * (1 - p);
  const pas = (2 * Math.PI) / ETINCELLES.nombre;
  const traits: Trait[] = [];
  for (let i = 0; i < ETINCELLES.nombre; i++) {
    const angle = pas * i + pas / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    traits.push({
      x1: x + distance * cos,
      y1: y + distance * sin,
      x2: x + (distance + longueur) * cos,
      y2: y + (distance + longueur) * sin,
    });
  }
  return traits;
}

/** Requête qui décide du montage : souris ou pavé, et mouvement accepté. */
export const REQUETE_ETINCELLES =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
