"use client";

import { useEffect, useState, type CSSProperties, type RefObject } from "react";
import { useReducedMotion } from "motion/react";
import { urlImageFond } from "@/lib/image-fond";
import {
  LARGEUR_ATTENTE,
  LARGEUR_MIN_EFFET,
  deroulerChargement,
  tailleMiniature,
  type Etape,
} from "@/lib/images/paliers";

/** L'image chargée, réduite à `colonnes` colonnes, en PNG. */
function miniature(img: HTMLImageElement, colonnes: number): string {
  const { largeur, hauteur } = tailleMiniature(
    colonnes,
    img.naturalWidth,
    img.naturalHeight,
  );
  const toile = document.createElement("canvas");
  toile.width = largeur;
  toile.height = hauteur;
  toile.getContext("2d")?.drawImage(img, 0, 0, largeur, hauteur);
  return toile.toDataURL();
}

/**
 * Pixelisation comme ÉTAT DE CHARGEMENT, pas comme animation (déroulé dans
 * `deroulerChargement`, `@/lib/images/paliers`).
 *
 * À l'entrée dans l'écran : image déjà chargée, ou arrivée dans le délai de
 * grâce (200 ms), elle s'affiche nette, sans aucune étape. Sinon sa version de
 * 32 px, agrandie en pixels, tient lieu d'image ; à l'arrivée de la vraie,
 * trois étapes de 60 ms (48, 96, 128 colonnes) mènent à la version nette.
 *
 * Rend ce qui tient lieu d'image (l'adresse de l'attente en 32 px, ou une
 * miniature en `data:`), ou `null` quand l'image elle-même se montre. Le
 * composant la pose en fond pixelisé (`image-rendering: pixelated`).
 *
 * `charger` rend l'image décodée, `null` en cas d'échec ; `estChargee` dit si
 * elle l'est déjà.
 *
 * Jamais de pixels : `actif` faux, mouvement réduit (l'image nette à son
 * arrivée), cible de moins de 80 px de large.
 */
export function useDepixelisation({
  cible,
  src,
  actif,
  estChargee,
  charger,
}: {
  cible: RefObject<HTMLElement | null>;
  src: string;
  actif: boolean;
  estChargee: () => boolean;
  charger: () => Promise<HTMLImageElement | null>;
}): string | null {
  const [etape, setEtape] = useState<string | null>(null);
  const reduit = useReducedMotion();

  useEffect(() => {
    const element = cible.current;
    if (!element || !actif || reduit) return;

    let annule = false;
    const minuteries: number[] = [];
    const attendre = (ms: number) =>
      new Promise<void>((fin) => {
        minuteries.push(window.setTimeout(fin, ms));
      });
    const montrer = (suivante: Etape<HTMLImageElement> | null) => {
      if (suivante === null) setEtape(null);
      else if (suivante.type === "attente")
        setEtape(urlImageFond(src, LARGEUR_ATTENTE));
      else setEtape(miniature(suivante.img, suivante.colonnes));
    };

    const observateur = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((entree) => entree.isIntersecting)) return;
        observateur.disconnect();
        if (element.getBoundingClientRect().width < LARGEUR_MIN_EFFET) return;
        void deroulerChargement({
          estChargee,
          charger,
          attendre,
          montrer,
          estAnnule: () => annule,
        });
      },
      { threshold: 0.15 },
    );
    observateur.observe(element);
    return () => {
      annule = true;
      observateur.disconnect();
      minuteries.forEach((id) => window.clearTimeout(id));
    };
    // `estChargee` et `charger` sont lus au moment du jeu, pas suivis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cible, src, actif, reduit]);

  return etape;
}

/** `<img>` chargée et décodable. */
export const imgChargee = (img: HTMLImageElement | null) =>
  img !== null && img.complete && img.naturalWidth > 0;

/** Attend le chargement d'un `<img>` ; `null` s'il échoue. */
export function chargementImg(
  img: HTMLImageElement | null,
): Promise<HTMLImageElement | null> {
  if (!img || imgChargee(img)) return Promise.resolve(img);
  return new Promise((fin) => {
    img.addEventListener("load", () => fin(img), { once: true });
    img.addEventListener("error", () => fin(null), { once: true });
  });
}

/** Charge une image par son adresse ; `null` si elle échoue. */
export function chargementUrl(url: string): Promise<HTMLImageElement | null> {
  return new Promise((fin) => {
    const img = new window.Image();
    img.onload = () => fin(img);
    img.onerror = () => fin(null);
    img.src = url;
  });
}

/**
 * Image déjà dans le cache du navigateur : une `Image` neuve sur la même
 * adresse est complète dès l'affectation de `src`.
 */
export function urlEnCache(url: string): boolean {
  const img = new window.Image();
  img.src = url;
  return imgChargee(img);
}

/**
 * Affiche d'une `<video>` pixelisée seulement si elle tarde, comme une
 * `<ImageProgressive>`. `src` est le chemin du fichier (clé de l'effet, et
 * source de l'attente en 32 px), `url` l'adresse réellement posée en `poster` :
 * c'est elle qu'on charge, pour ne rien télécharger deux fois.
 *
 * Même mécanique que `styleEtape` : `object-position` pousse l'affiche et les
 * images de la vidéo hors de la boîte, le fond pixelisé se voit. Si la vidéo
 * démarre pendant l'attente, elle n'apparaît qu'à l'image nette.
 */
export function useAfficheDepixelisee({
  video,
  src,
  url,
  className,
  actif = true,
}: {
  video: RefObject<HTMLVideoElement | null>;
  src: string;
  url: string;
  className?: string;
  actif?: boolean;
}): CSSProperties | null {
  const etape = useDepixelisation({
    cible: video,
    src,
    actif,
    estChargee: () => urlEnCache(url),
    charger: () => chargementUrl(url),
  });
  return styleEtape(etape, className);
}

/**
 * Style d'un `<img>` pendant l'effet : l'étape en fond pixelisé, et le contenu
 * de l'image poussé hors de sa boîte par `object-position` pour que seul le
 * fond se voie. `null` hors effet.
 */
export function styleEtape(
  etape: string | null,
  className: string | undefined,
): CSSProperties | null {
  if (!etape) return null;
  return {
    backgroundImage: `url("${etape}")`,
    backgroundSize: /\bobject-contain\b/.test(className ?? "")
      ? "contain"
      : "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    objectPosition: "-99999px -99999px",
  };
}
