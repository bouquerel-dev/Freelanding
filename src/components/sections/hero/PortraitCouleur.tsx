"use client";

import { useEffect, useRef } from "react";

/**
 * PORTRAIT COULEUR DU HÉROS, ORDINATEUR SEULEMENT (2026-11-24, choix
 * d'Eliott : « oui, couleur »). La photo détourée par
 * `scripts/detourer-portrait.mjs` est peinte dans une toile plutôt qu'en
 * `<img>` : une toile n'est jamais candidate au LCP, qui reste le titre.
 *
 * Elle n'est chargée qu'au-delà de 1 200 px (au montage, ou quand la fenêtre
 * franchit ce seuil) : le téléphone garde la trame et ne télécharge rien.
 * Placement et fondu : `.hero-photo` dans globals.css.
 */
export function PortraitCouleur({ src }: { src: string }) {
  const toile = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const t = toile.current;
    if (!t) return;
    const ordinateur = window.matchMedia("(min-width: 1200px)");
    let image: HTMLImageElement | null = null;
    const charger = () => {
      if (image || !ordinateur.matches) return;
      const img = new window.Image();
      image = img;
      img.onload = () => {
        const ctx = t.getContext("2d");
        if (!ctx) return;
        t.width = img.naturalWidth;
        t.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        t.dataset.pret = "1";
      };
      img.src = src;
    };
    charger();
    ordinateur.addEventListener("change", charger);
    return () => {
      ordinateur.removeEventListener("change", charger);
      if (image) image.onload = null;
    };
  }, [src]);

  return <canvas ref={toile} aria-hidden data-part="hero-photo" className="hero-photo absolute hidden desktop:block" />;
}
