"use client";

import { useEffect } from "react";
import { REQUETE_ETINCELLES, ETINCELLES, traitsAuTemps } from "./etincelles";

/**
 * Étincelles volt au clic, sur ordinateur seulement (2026-11-24, demande
 * d'Eliott, d'après le « Click Spark » de reactbits.dev).
 *
 * COÛT AU REPOS : un écouteur `pointerdown` passif, rien d'autre. Le canevas
 * n'est créé qu'au premier clic, la boucle d'images ne tourne que pendant les
 * 400 ms d'un éclat puis s'arrête. Il n'entre jamais dans la mesure LCP : il
 * n'existe pas avant une interaction, et une fois créé il est vide de contenu
 * peint au chargement.
 *
 * Rien au doigt ni en mouvement réduit : la requête `REQUETE_ETINCELLES` est
 * relue à chaque clic, une bascule du réglage système prend donc effet sans
 * recharger. La feuille `interactions.css` masque en plus le canevas en
 * mouvement réduit.
 */
type Eclat = { x: number; y: number; debut: number };

export function EtincellesClic() {
  useEffect(() => {
    const requete = window.matchMedia(REQUETE_ETINCELLES);
    let canevas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let couleur = "";
    let image = 0;
    const eclats: Eclat[] = [];

    const preparer = () => {
      if (!canevas) {
        canevas = document.createElement("canvas");
        canevas.className = "etincelles-clic";
        canevas.setAttribute("aria-hidden", "true");
        document.body.appendChild(canevas);
        ctx = canevas.getContext("2d");
        couleur =
          getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() ||
          "#c8f24a";
      }
      const ratio = window.devicePixelRatio || 1;
      const largeur = Math.round(window.innerWidth * ratio);
      const hauteur = Math.round(window.innerHeight * ratio);
      if (canevas.width !== largeur || canevas.height !== hauteur) {
        canevas.width = largeur;
        canevas.height = hauteur;
      }
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    // L'horloge est celle du clic (`performance.now`), pas l'horodatage de
    // l'image : un seul temps de référence pour le départ et le dessin.
    const dessiner = () => {
      if (!ctx || !canevas) return;
      const maintenant = performance.now();
      ctx.clearRect(0, 0, canevas.width, canevas.height);
      ctx.strokeStyle = couleur;
      ctx.lineWidth = ETINCELLES.epaisseur;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = eclats.length - 1; i >= 0; i--) {
        const e = eclats[i];
        const traits = traitsAuTemps(e.x, e.y, maintenant - e.debut);
        if (!traits) {
          eclats.splice(i, 1);
          continue;
        }
        for (const t of traits) {
          ctx.moveTo(t.x1, t.y1);
          ctx.lineTo(t.x2, t.y2);
        }
      }
      ctx.stroke();
      image = eclats.length > 0 ? requestAnimationFrame(dessiner) : 0;
    };

    const auClic = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0 || !requete.matches) return;
      preparer();
      eclats.push({ x: event.clientX, y: event.clientY, debut: performance.now() });
      if (!image) image = requestAnimationFrame(dessiner);
    };

    document.addEventListener("pointerdown", auClic, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", auClic);
      if (image) cancelAnimationFrame(image);
      canevas?.remove();
    };
  }, []);

  return null;
}
