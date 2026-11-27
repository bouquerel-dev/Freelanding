"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { useReducedMotionAfterMount } from "@/components/motion/reducedMotion";

/**
 * L'APLAT QUI S'OUVRE (demande d'Eliott du 2026-11-27 : « belles animations à
 * l'apparition des sections, surprenant au scroll »).
 *
 * Le fond d'une section en deux parties arrive en panneau arrondi, en retrait
 * dans la couleur de la section précédente, puis s'élargit jusqu'aux bords à
 * mesure que la section monte. Le filet central se trace du haut vers le bas
 * pendant la seconde moitié de la course. Le texte, lui, ne bouge pas avec le
 * défilement : seul le fond est découpé, rien n'est jamais illisible.
 *
 * `clip-path` et `transform` uniquement : aucune propriété de mise en page.
 * Mouvement réduit : fond plein et filet entier, dès le rendu qui suit
 * l'hydratation (cf. `useReducedMotionAfterMount`).
 */
export const DECOUPE_DEPART = "inset(64px 3% 0px 3% round 24px)";
export const DECOUPE_FIN = "inset(0px 0% 0px 0% round 0px)";

export function Ouverture({
  fond,
  autour,
  filet,
}: {
  /** Classe de fond de la section (ex. `bg-accent`). */
  fond: string;
  /** Classe de fond visible autour du panneau : celle de la section d'avant. */
  autour: string;
  /** Classe de couleur du filet central, absent si non fourni. */
  filet?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduit = useReducedMotionAfterMount();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.15"] });
  const clipPath = useTransform(scrollYProgress, [0, 1], [DECOUPE_DEPART, DECOUPE_FIN]);
  const scaleY = useTransform(scrollYProgress, [0.4, 1], [0, 1]);

  return (
    <div ref={ref} aria-hidden data-part="ouverture" className={`pointer-events-none absolute inset-0 z-0 ${autour}`}>
      <motion.div className={`absolute inset-0 ${fond}`} style={reduit ? undefined : { clipPath }} />
      {filet ? (
        <motion.div
          className={`absolute left-[calc(50%-0.5px)] top-0 hidden h-full w-px origin-top tablet:block ${filet}`}
          style={reduit ? undefined : { scaleY }}
        />
      ) : null}
    </div>
  );
}
