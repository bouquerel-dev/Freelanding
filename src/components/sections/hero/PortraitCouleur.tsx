"use client";

import { useEffect, useRef } from "react";

/** Temps laissé à la trame pour naître avant que la photo la recouvre. */
export const ATTENTE_TRAME_MS = 900;
/** Durée du passage de la trame à la photo, avant que la lampe prenne la main. */
export const PASSAGE_MS = 1000;

/**
 * PORTRAIT COULEUR DU HÉROS, TOUTES TAILLES (2026-11-24 : Eliott veut la vraie
 * photo sur téléphone aussi). La photo détourée par
 * `scripts/detourer-portrait.mjs` est peinte dans une toile plutôt qu'en
 * `<img>` : une toile n'est jamais candidate au LCP, qui reste le titre.
 *
 * L'ARRIVÉE. La trame (`VisageTrame`, petite image de 8 ko) naît d'abord ;
 * la photo n'apparaît qu'une fois chargée et la vague de la trame finie
 * (`ATTENTE_TRAME_MS` après sa naissance ; si la photo arrive avant la trame,
 * elle passe directement), puis la scène passe par deux états posés sur
 * `[data-scene]` : `photo` (la photo s'ouvre depuis le visage, du flou au net,
 * la trame s'efface), puis `lampe` (la trame ne vit plus que sous la souris).
 * Mouvement réduit : la photo arrive dès qu'elle est là, sans attente.
 * Dessin des états : `.hero-photo` et `.hero-visage` dans globals.css.
 */
export function PortraitCouleur({ src }: { src: string }) {
  const toile = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const t = toile.current;
    if (!t) return;
    const scene = t.closest<HTMLElement>("[data-scene]");
    const immobile = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minuteurs: number[] = [];
    let actif = true;

    const montrer = () => {
      if (!actif) return;
      t.dataset.pret = "1";
      if (scene) scene.dataset.scene = "photo";
      minuteurs.push(
        window.setTimeout(() => {
          if (scene) scene.dataset.scene = "lampe";
        }, immobile ? 0 : PASSAGE_MS),
      );
    };

    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => {
      const ctx = t.getContext("2d");
      if (!actif || !ctx) return;
      t.width = img.naturalWidth;
      t.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      // La trame déjà née finit sa vague ; pas encore née, la photo passe devant.
      const depuis = Number(scene?.dataset.trameDepuis);
      const reste = immobile || !depuis ? 0 : Math.max(0, ATTENTE_TRAME_MS - (performance.now() - depuis));
      minuteurs.push(window.setTimeout(montrer, reste));
    };
    img.src = src;

    return () => {
      actif = false;
      img.onload = null;
      for (const m of minuteurs) window.clearTimeout(m);
    };
  }, [src]);

  return <canvas ref={toile} aria-hidden data-part="hero-photo" className="hero-photo absolute inset-0 h-full w-full" />;
}
