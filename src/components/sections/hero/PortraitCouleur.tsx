"use client";

import { useEffect, useRef } from "react";

/** Temps laissé à la trame pour naître avant que la photo la recouvre. */
export const ATTENTE_TRAME_MS = 600;
/** Durée du passage de la trame à la photo, avant que la lampe prenne la main. */
export const PASSAGE_MS = 800;
/** Plafond d'attente de la trame : au-delà, la photo passe sans elle. */
export const TRAME_MAX_MS = 1400;

/**
 * PORTRAIT COULEUR DU HÉROS, TOUTES TAILLES (2026-11-24 : Eliott veut la vraie
 * photo sur téléphone aussi). La photo détourée par
 * `scripts/detourer-portrait.py` est peinte dans une toile plutôt qu'en
 * `<img>` : une toile n'est jamais candidate au LCP, qui reste le titre.
 *
 * L'ARRIVÉE. La trame (`VisageTrame`, petite image de 8 ko) naît d'abord ;
 * la photo n'apparaît qu'une fois chargée et la vague de la trame finie
 * (`ATTENTE_TRAME_MS` après sa naissance, même chargée la première ; trame
 * absente au bout de `TRAME_MAX_MS`, la photo passe sans elle), puis la scène passe par deux états posés sur
 * `[data-scene]` : `photo` (la photo s'ouvre depuis le visage, du flou au net,
 * la trame s'efface), puis `lampe` (la trame ne vit plus que sous la souris).
 * Mouvement réduit : la photo arrive dès qu'elle est là, sans attente.
 * Dessin des états : `.hero-photo` et `.hero-visage` dans globals.css.
 */
export function PortraitCouleur({ src }: { src: string }) {
  const toile = useRef<HTMLCanvasElement>(null);
  useEffect(() => animerPortrait(toile.current, src), [src]);
  return <canvas ref={toile} aria-hidden data-part="hero-photo" className="hero-photo absolute inset-0 h-full w-full" />;
}

/** Charge la photo dans la toile et mène la scène ; rend de quoi tout défaire. */
export function animerPortrait(t: HTMLCanvasElement | null, src: string): (() => void) | undefined {
  if (!t) return undefined;
  const scene = t.closest<HTMLElement>("[data-scene]");
  const immobile = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const minuteurs: number[] = [];
  const observateurs: MutationObserver[] = [];
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
    if (immobile || !scene) {
      montrer();
      return;
    }
    attendreTrame(scene);
  };

  // La photo laisse toujours la trame finir sa vague, même chargée la
  // première (connexion rapide, cache). Trame absente : plafond, puis passage.
  const attendreTrame = (sc: HTMLElement) => {
    let fait = false;
    const passer = () => {
      if (fait) return;
      fait = true;
      suivi.disconnect();
      const depuis = Number(sc.dataset.trameDepuis);
      const reste = depuis ? Math.max(0, ATTENTE_TRAME_MS - (performance.now() - depuis)) : 0;
      minuteurs.push(window.setTimeout(montrer, reste));
    };
    // Seul `data-trame-depuis` est suivi : il n'est posé qu'à la naissance.
    const suivi = new window.MutationObserver(passer);
    if (sc.dataset.trameDepuis) {
      passer();
      return;
    }
    suivi.observe(scene as HTMLElement, { attributes: true, attributeFilter: ["data-trame-depuis"] });
    observateurs.push(suivi);
    minuteurs.push(window.setTimeout(passer, TRAME_MAX_MS));
  };
  img.src = src;

  return () => {
    actif = false;
    img.onload = null;
    for (const m of minuteurs) window.clearTimeout(m);
    for (const o of observateurs) o.disconnect();
  };
}
