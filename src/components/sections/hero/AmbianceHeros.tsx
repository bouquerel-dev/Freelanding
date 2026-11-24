"use client";

import { useEffect, useRef } from "react";

/** Amorti de la lampe : part de l'écart rattrapée à chaque image. */
const AMORTI = 0.08;

/**
 * FOND VIVANT DU HÉROS, ORDINATEUR SEULEMENT (2026-11-24, demande d'Eliott :
 * « vraiment quelque chose de plus » derrière la split view). Trois couches,
 * toutes tirées de la trame du visage, pour que le fond et le portrait soient
 * la même matière :
 *
 * - un champ de points très pâle sur tout le héros, fondu vers les bords ;
 * - une ronde : sans souris, une lampe large fait lentement le tour du héros
 *   et allume le champ en volt sur son passage (CSS seul) ;
 * - une lampe qui suit la souris, plus serrée, qui prend le relais de la ronde
 *   dès que la souris entre dans le héros ;
 * - un halo volt qui respire lentement derrière le visage.
 *
 * COÛT. La lampe bouge par `transform` seulement (le motif est contre-décalé
 * dans la lampe pour rester calé sur le champ), avec une boucle amortie qui
 * s'arrête quand elle a rejoint la souris. Hors écran, la section reçoit
 * `data-ambiance="pause"` : la boucle s'arrête et les animations CSS se
 * figent. Mouvement réduit ou pointeur tactile : ni ronde ni lampe, le champ
 * et le halo restent immobiles.
 *
 * Décor pur (`aria-hidden`), sous le texte (`z-0`), jamais candidat au LCP.
 */
export function AmbianceHeros() {
  const racine = useRef<HTMLDivElement>(null);
  const lampe = useRef<HTMLSpanElement>(null);
  const motif = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const r = racine.current;
    const l = lampe.current;
    const m = motif.current;
    const section = r?.closest("section");
    if (!r || !l || !m || !section) return;

    const ordinateur = window.matchMedia("(min-width: 1200px)");
    const vivant =
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const pos = { x: 0, y: 0 };
    const cible = { x: 0, y: 0 };
    let cadre = 0;
    let visible = true;

    const poser = () => {
      l.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      m.style.transform = `translate3d(${-pos.x}px, ${-pos.y}px, 0)`;
    };

    const avancer = () => {
      cadre = 0;
      const dx = cible.x - pos.x;
      const dy = cible.y - pos.y;
      if (Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4) {
        pos.x = cible.x;
        pos.y = cible.y;
        poser();
        return;
      }
      pos.x += dx * AMORTI;
      pos.y += dy * AMORTI;
      poser();
      cadre = window.requestAnimationFrame(avancer);
    };
    const relancer = () => {
      if (!cadre && visible) cadre = window.requestAnimationFrame(avancer);
    };

    const suivre = (e: PointerEvent) => {
      if (!ordinateur.matches) return;
      const b = r.getBoundingClientRect();
      cible.x = e.clientX - b.left;
      cible.y = e.clientY - b.top;
      if (section.dataset.pointeur !== "1") {
        // Première entrée : la lampe naît sous la souris, sans traverser l'écran.
        section.dataset.pointeur = "1";
        pos.x = cible.x;
        pos.y = cible.y;
        poser();
      }
      relancer();
    };
    const quitter = () => {
      section.dataset.pointeur = "";
    };
    const obs = new IntersectionObserver(([entree]) => {
      visible = Boolean(entree?.isIntersecting);
      section.dataset.ambiance = visible ? "" : "pause";
      if (!visible && cadre) {
        window.cancelAnimationFrame(cadre);
        cadre = 0;
      }
    });
    obs.observe(section);

    if (vivant) {
      section.addEventListener("pointermove", suivre);
      section.addEventListener("pointerleave", quitter);
    }
    return () => {
      obs.disconnect();
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
      className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden desktop:block"
    >
      <span className="amb-champ absolute inset-0" />
      <span className="amb-halo absolute right-[6%] top-[8%] h-[84%] w-[56%]" />
      <span className="amb-ronde absolute">
        <span className="absolute" />
      </span>
      <span ref={lampe} className="amb-lampe absolute left-0 top-0">
        <span ref={motif} className="amb-lampe-motif absolute" />
      </span>
    </div>
  );
}
