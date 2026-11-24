"use client";

import { useEffect, useRef } from "react";

/**
 * LE VISAGE D'ELIOTT EN TRAME DE POINTS, posé dans le h1 (2026-11-24, demande
 * d'Eliott : « ma tête en petit, centrée sur la baseline, pour qu'on voie qui je
 * suis »). La photo détourée sur fond volt est relue en points : le fond volt
 * est écarté, chaque point grossit avec la lumière, et la trame pivote un peu
 * sous la souris pour donner du relief. Décor pur : le nom est écrit juste
 * au-dessus en texte.
 *
 * Mouvement réduit : une seule image, plus de suivi de la souris.
 */
export function VisageTrame({ src }: { src: string }) {
  const toile = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = toile.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const immobile = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const points: [number, number, number][] = [];
    let mx = 0;
    let my = 0;
    let cadre = 0;
    let vivant = true;
    const dessiner = () => {
      if (!vivant) return;
      const ratio = Math.min(window.devicePixelRatio, 2);
      const l = Math.round(c.clientWidth * ratio);
      const h = Math.round(c.clientHeight * ratio);
      if (c.width !== l) c.width = l;
      if (c.height !== h) c.height = h;
      ctx.clearRect(0, 0, l, h);
      ctx.fillStyle = getComputedStyle(c).color;
      const s = l * 1.5;
      const ox = (l - s) / 2;
      const oy = -h * 0.12;
      for (const [u, v, lum] of points) {
        const z = lum - 0.5;
        ctx.globalAlpha = 0.25 + lum * 0.75;
        ctx.beginPath();
        ctx.arc(ox + u * s + mx * z * 14 * ratio, oy + v * s * 0.62 + my * z * 10 * ratio, (0.3 + lum * 2.1) * ratio * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!immobile) cadre = window.requestAnimationFrame(dessiner);
    };
    const img = new window.Image();
    img.onload = () => {
      const largeur = 170;
      const hauteur = Math.round((largeur * img.naturalHeight) / img.naturalWidth);
      const hors = document.createElement("canvas");
      hors.width = largeur;
      hors.height = hauteur;
      const hctx = hors.getContext("2d");
      if (!hctx) return;
      hctx.drawImage(img, 0, 0, largeur, hauteur);
      const d = hctx.getImageData(0, 0, largeur, hauteur).data;
      for (let j = 0; j < hauteur; j += 2) {
        for (let i = 0; i < largeur; i += 2) {
          const k = (j * largeur + i) * 4;
          const r = d[k] ?? 0;
          const g = d[k + 1] ?? 0;
          const b = d[k + 2] ?? 0;
          // Fond volt de la photo : écarté, la trame ne garde que le portrait.
          if (g > 170 && r > 150 && 120 > b) continue;
          points.push([i / largeur, j / hauteur, (r + g + b) / 765]);
        }
      }
      dessiner();
    };
    img.src = src;
    const suivre = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!immobile) window.addEventListener("pointermove", suivre, { passive: true });
    return () => {
      vivant = false;
      window.cancelAnimationFrame(cadre);
      window.removeEventListener("pointermove", suivre);
    };
  }, [src]);
  return (
    <span
      aria-hidden
      data-part="hero-visage"
      className="relative mx-[0.08em] inline-block h-[0.92em] w-[1.5em] overflow-hidden rounded-[0.46em] bg-surface-2 align-[-0.1em] text-accent outline outline-1 outline-accent/35"
    >
      <canvas ref={toile} className="absolute inset-0 h-full w-full" />
    </span>
  );
}
