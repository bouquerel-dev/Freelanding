"use client";

import { useEffect, useState } from "react";

const LETTRES = "abcdefghijklmnopqrstuvwxyz";

/**
 * « JE CONSTRUIS … » : la ligne passe d'une prestation à l'autre, lettres
 * brouillées puis posées (idée reprise du « I build » de rubenmarcus.dev, que
 * cite Eliott le 2026-11-24). La première prestation est rendue par le
 * serveur ; un lecteur d'écran lit la liste complète, jamais l'animation.
 */
export function JeConstruis({ prefixe, elements }: { prefixe: string; elements: readonly string[] }) {
  const [texte, setTexte] = useState(elements[0] ?? "");
  useEffect(() => {
    if (elements.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let n = 0;
    let brouille = 0;
    const tour = window.setInterval(() => {
      n = (n + 1) % elements.length;
      const cible = elements[n] ?? "";
      let pose = 0;
      window.clearInterval(brouille);
      brouille = window.setInterval(() => {
        setTexte(
          cible
            .split("")
            .map((ch, i) => (i < pose || ch === " " ? ch : (LETTRES[Math.floor(Math.random() * 26)] ?? ch)))
            .join(""),
        );
        pose += 2;
        if (pose > cible.length) {
          setTexte(cible);
          window.clearInterval(brouille);
        }
      }, 30);
    }, 2800);
    return () => {
      window.clearInterval(tour);
      window.clearInterval(brouille);
    };
  }, [elements]);
  return (
    <p className="m-0 font-mono text-[12px] uppercase leading-[1.4] tracking-[0.02em] text-foreground-60 tablet:text-[13px]">
      <span className="sr-only">
        {prefixe} {elements.join(", ")}.
      </span>
      <span aria-hidden>
        {prefixe} <span className="text-accent">{texte}</span>
      </span>
    </p>
  );
}
