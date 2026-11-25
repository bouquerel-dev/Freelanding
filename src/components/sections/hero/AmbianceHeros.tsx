"use client";

import { useEffect, useRef } from "react";

/** Amorti de la lampe : part de l'écart rattrapée à chaque image. */
const AMORTI = 0.08;
/** Écart entre deux fils, et entre deux points d'un fil, en pixels CSS. */
const ECART_FILS = 22;
const PAS_X = 10;
/** Rayon d'écartement autour de la souris, et poussée maximale. */
const RAYON = 150;
const POUSSEE = 26;
/** Durée du tissage d'entrée : les fils se tracent de gauche à droite. */
const TISSAGE_MS = 1600;
/** Image d'animation théorique, quand le navigateur ne donne pas l'heure. */
const IMAGE_MS = 16.7;

/** Sortie forte (expo) : départ franc, arrivée douce. */
function sortie(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x === 1 ? 1 : 1 - 2 ** (-10 * x);
}

/**
 * FOND VIVANT DU HÉROS (2026-11-24, refonte). Le champ de points, jugé « très
 * IA » par Eliott, laisse la place à des fils fins (inspiration : « Threads »
 * de reactbits, réécrit ici en toile 2D, sans dépendance) :
 *
 * - une cinquantaine de fils volt très pâles qui ondulent lentement ;
 * - à l'arrivée, ils se tissent de gauche à droite ;
 * - sous la souris (ordinateur), ils s'écartent et s'allument, comme des
 *   courbes de niveau autour d'un relief ;
 * - un halo volt qui respire derrière le visage.
 *
 * La position lissée de la souris sert aussi à la trame du visage : elle n'est
 * révélée que sous la lampe (`--lx`, `--ly` posés sur `.hero-visage`, dans
 * son repère).
 *
 * COÛT. Une seule toile, un trait par fil, rendu plafonné à 1,5 pixel par
 * pixel CSS. Hors écran, la boucle s'arrête et `data-ambiance="pause"` fige
 * le halo. Mouvement réduit : une image, fils immobiles, aucune écoute.
 *
 * Décor pur (`aria-hidden`), sous le texte (`z-0`), jamais candidat au LCP.
 */
export function AmbianceHeros() {
  const racine = useRef<HTMLDivElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const r = racine.current;
    const c = toile.current;
    const section = r?.closest("section");
    const ctx = c?.getContext("2d");
    if (!r || !c || !section || !ctx) return;
    const visage = section.querySelector<HTMLElement>(".hero-visage");
    const decalage = { x: 0, y: 0 };

    const ordinateur = window.matchMedia("(min-width: 1200px)");
    const immobile = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const souris = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const pos = { x: 0, y: 0 };
    const cible = { x: 0, y: 0 };
    // Présence de la souris, lissée de 0 à 1 : les fils s'écartent en douceur.
    let presence = 0;
    let dedans = false;
    let cadre = 0;
    let visible = true;
    let debut: number | null = immobile ? -Infinity : null;
    let images = 0;

    const couleur = window.getComputedStyle(c).color;

    const dessiner = (instant?: number) => {
      cadre = 0;
      images += 1;
      const maintenant = typeof instant === "number" ? instant : images * IMAGE_MS;
      if (debut === null) debut = maintenant;
      // Au doigt, une image sur deux une fois les fils tissés : la batterie d'abord.
      if (!souris && images % 2 === 0 && maintenant - debut > TISSAGE_MS) {
        cadre = window.requestAnimationFrame(dessiner);
        return;
      }
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      const l = c.clientWidth;
      const h = c.clientHeight;
      if (!l || !h) return;
      const lp = Math.round(l * dpr);
      const hp = Math.round(h * dpr);
      if (c.width !== lp) c.width = lp;
      if (c.height !== hp) c.height = hp;

      // Lampe : amortie vers la souris, présence lissée.
      pos.x += (cible.x - pos.x) * AMORTI;
      pos.y += (cible.y - pos.y) * AMORTI;
      presence += ((dedans ? 1 : 0) - presence) * 0.06;
      // La lampe s'ouvre et se referme avec la présence : rayon de 0 à
      // 170 px, au lieu d'apparaître ou de s'éteindre d'un coup.
      if (visage && (dedans || presence > 0.02)) {
        visage.style.setProperty("--lx", `${pos.x - decalage.x}px`);
        visage.style.setProperty("--ly", `${pos.y - decalage.y}px`);
        visage.style.setProperty("--lr", `${Math.round(presence * 170)}px`);
      } else if (visage?.style.getPropertyValue("--lx")) {
        for (const v of ["--lx", "--ly", "--lr"]) visage.style.removeProperty(v);
      }

      const temps = immobile ? 0 : (maintenant - debut) / 1000;
      const tissage = immobile ? 1 : sortie((maintenant - debut) / TISSAGE_MS);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, l, h);
      ctx.strokeStyle = couleur;
      ctx.lineWidth = 1;
      const fils = Math.ceil(h / ECART_FILS) + 2;
      const fin = l * tissage + PAS_X;
      for (let i = 0; i < fils; i += 1) {
        const y0 = (i - 1) * ECART_FILS;
        // Plus pâle loin du milieu de la hauteur : la matière se concentre.
        let lueur = 0;
        ctx.beginPath();
        for (let x = 0; x <= fin; x += PAS_X) {
          const onde =
            Math.sin(x * 0.0042 + temps * 0.32 + i * 0.31) * 0.6 + Math.sin(x * 0.0093 - temps * 0.21 + i * 0.57) * 0.4;
          let y = y0 + onde * 16;
          if (presence > 0.01) {
            const dx = x - pos.x;
            const dy = y - pos.y;
            const force = Math.exp(-(dx * dx + dy * dy) / (RAYON * RAYON)) * presence;
            // Écart souple de part et d'autre du curseur, sans coude sur sa ligne.
            y += Math.tanh(dy / 20) * force * POUSSEE;
            lueur = Math.max(lueur, force);
          }
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        // Discrets, même sous la souris : le volt vif reste aux six traits.
        ctx.globalAlpha = 0.06 + lueur * 0.18;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (!immobile && visible) cadre = window.requestAnimationFrame(dessiner);
    };
    const relancer = () => {
      if (!cadre && visible) cadre = window.requestAnimationFrame(dessiner);
    };

    const suivre = (e: PointerEvent) => {
      if (!ordinateur.matches) return;
      const b = r.getBoundingClientRect();
      // Grand écran : la page est zoomée (`--zoom-ecran`), la souris et les
      // boîtes parlent en pixels d'écran, la toile et la lampe en pixels CSS.
      // Sans cette division, la lampe partait loin de la souris.
      const zoom = r.offsetWidth ? b.width / r.offsetWidth : 1;
      cible.x = (e.clientX - b.left) / zoom;
      cible.y = (e.clientY - b.top) / zoom;
      if (visage) {
        const v = visage.getBoundingClientRect();
        decalage.x = (v.left - b.left) / zoom;
        decalage.y = (v.top - b.top) / zoom;
      }
      if (!dedans) {
        // Première entrée : la lampe naît sous la souris, sans traverser l'écran.
        dedans = true;
        section.dataset.pointeur = "1";
        pos.x = cible.x;
        pos.y = cible.y;
      }
      relancer();
    };
    const quitter = () => {
      dedans = false;
      section.dataset.pointeur = "";
      // La lampe se referme en quelques images (voir `presence`).
      relancer();
    };
    const obs = new IntersectionObserver(([entree]) => {
      visible = entree?.isIntersecting ?? true;
      section.dataset.ambiance = visible ? "" : "pause";
      if (!visible && cadre) {
        window.cancelAnimationFrame(cadre);
        cadre = 0;
      }
      relancer();
    });
    obs.observe(section);
    const taille = new ResizeObserver(relancer);
    taille.observe(c);

    if (!immobile && souris) {
      section.addEventListener("pointermove", suivre);
      section.addEventListener("pointerleave", quitter);
    }
    relancer();
    return () => {
      obs.disconnect();
      taille.disconnect();
      section.removeEventListener("pointermove", suivre);
      section.removeEventListener("pointerleave", quitter);
      if (cadre) window.cancelAnimationFrame(cadre);
    };
  }, []);

  return (
    <div
      ref={racine}
      aria-hidden
      data-part="hero-ambiance"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <span className="amb-halo absolute right-[6%] top-[8%] hidden h-[84%] w-[56%] desktop:block" />
      <canvas ref={toile} className="amb-fils absolute inset-0 h-full w-full text-accent" />
    </div>
  );
}
