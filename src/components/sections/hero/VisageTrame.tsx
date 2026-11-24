"use client";

import { useEffect, useRef } from "react";

type Point = readonly [u: number, v: number, lumiere: number];

/**
 * Largeur d'échantillonnage de la photo. Un point sur deux colonnes est tracé :
 * l'écart entre deux points vaut `largeur / colonnes * 2`, visé entre 5 px (petit
 * visage, sur téléphone, pour qu'il reste lisible) et un peu plus de 8 px (grand
 * visage, sur ordinateur, pour garder l'effet de trame).
 */
function colonnesPour(largeurRendue: number) {
  const ecart = Math.max(5, Math.min(8.4, largeurRendue / 150));
  return Math.round((largeurRendue * 2) / ecart);
}

/** Durée de la naissance de la trame, et retard du point le plus éloigné du visage. */
const NAISSANCE_MS = 520;
const VAGUE_MS = 640;
/** Image d'animation théorique, quand le navigateur ne donne pas l'heure. */
const IMAGE_MS = 16.7;

/** Sortie douce (cubique) : le point gonfle vite, puis se pose. */
function sortie(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

/** Relit la photo en points : le fond volt est écarté, chaque point garde sa lumière. */
function echantillonner(img: HTMLImageElement, largeur: number): Point[] {
  const hauteur = Math.round((largeur * img.naturalHeight) / img.naturalWidth);
  const hors = document.createElement("canvas");
  hors.width = largeur;
  hors.height = hauteur;
  const hctx = hors.getContext("2d");
  if (!hctx) return [];
  hctx.drawImage(img, 0, 0, largeur, hauteur);
  const d = hctx.getImageData(0, 0, largeur, hauteur).data;
  const points: Point[] = [];
  for (let j = 0; j < hauteur; j += 2) {
    for (let i = 0; i < largeur; i += 2) {
      const k = (j * largeur + i) * 4;
      const r = d[k] ?? 0;
      const g = d[k + 1] ?? 0;
      const b = d[k + 2] ?? 0;
      const a = d[k + 3] ?? 255;
      // Pixel transparent (photo détourée) ou fond volt (ancienne photo) : écarté.
      if (a < 128 || (g > 170 && r > 150 && 120 > b)) continue;
      points.push([i / largeur, j / hauteur, (r + g + b) / 765]);
    }
  }
  return points;
}

/**
 * LE VISAGE D'ELIOTT EN TRAME DE POINTS, GRAND FORMAT (version 2 « trame
 * géante », retenue par Eliott le 2026-11-24). La photo détourée sur fond volt
 * est relue en points ; chaque point grossit avec la lumière et la trame se
 * décale sous la souris, les points clairs plus que les sombres, ce qui donne
 * du relief.
 *
 * JAMAIS ÉTIRÉE. La maquette écrasait la photo dans la toile (rapport vertical
 * forcé) : ici l'échelle est la même sur les deux axes, la hauteur de la photo
 * remplit la toile et la largeur suit son vrai rapport. La toile peut changer
 * de forme, le visage ne se déforme pas, il se recadre.
 *
 * COÛT. La toile ne se redessine qu'en mouvement : la position suit la souris
 * avec un amorti, et la boucle s'arrête quand elle a rejoint sa cible. Hors
 * écran, rien ne tourne. Mouvement réduit : une seule image.
 *
 * Décor pur (`aria-hidden`) : le nom est écrit en texte dans le héros, et une
 * toile n'est jamais candidate au LCP, qui reste le h1.
 */
export function VisageTrame({ src }: { src: string }) {
  const toile = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = toile.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const immobile = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const img = new window.Image();
    let points: Point[] = [];
    let colonnes = 0;
    let rapport = 0;
    const cible = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let cadre = 0;
    let visible = true;
    // Naissance : les points gonflent en vague depuis le visage. `null` tant
    // que la photo n'est pas lue ; le temps vient du navigateur, ou se compte
    // en images quand il ne le donne pas.
    let naissance: number | null = immobile ? -Infinity : null;
    let images = 0;
    // La scène apprend que la trame est née (ou qu'elle ne viendra pas) : les
    // traits la suivent, la photo compte son attente à partir d'ici.
    const annoncer = () => {
      const scene = c.closest<HTMLElement>("[data-scene]");
      if (scene?.dataset.scene !== "true") return;
      scene.dataset.scene = "trame";
      scene.dataset.trameDepuis = String(performance.now());
    };

    const dessiner = (instant?: number) => {
      cadre = 0;
      if (!rapport) return;
      images += 1;
      const maintenant = typeof instant === "number" ? instant : images * IMAGE_MS;
      if (naissance === null) naissance = maintenant;
      annoncer();
      const age = maintenant - naissance;
      // Le coin le plus loin du visage est à 0,78 : son retard vaut 1,25 vague.
      const naissant = age < VAGUE_MS * 1.3 + NAISSANCE_MS;
      const dpr = Math.min(window.devicePixelRatio, 2);
      const l = Math.round(c.clientWidth * dpr);
      const h = Math.round(c.clientHeight * dpr);
      if (!l || !h) return;
      if (c.width !== l) c.width = l;
      if (c.height !== h) c.height = h;
      // Échelle uniforme : la photo prend toute la hauteur, sa largeur suit.
      const largeur = h / rapport;
      const voulues = colonnesPour(largeur / dpr);
      if (Math.abs(voulues - colonnes) > colonnes * 0.2) {
        colonnes = voulues;
        points = echantillonner(img, colonnes);
      }
      const pas = (largeur / colonnes) * 2;
      const ox = l / 2 - largeur / 2;
      const amplitude = pas * 1.8;
      ctx.clearRect(0, 0, l, h);
      ctx.fillStyle = window.getComputedStyle(c).color;
      for (const [u, v, lum] of points) {
        const z = lum - 0.5;
        const x = ox + u * largeur + pos.x * z * amplitude;
        const y = v * h + pos.y * z * amplitude * 0.7;
        if (x < -pas || x > l + pas) continue;
        // Chaque point attend selon sa distance au visage (0,5 ; 0,4).
        const ne = naissant ? sortie((age - Math.hypot(u - 0.5, v - 0.4) * 1.6 * VAGUE_MS) / NAISSANCE_MS) : 1;
        if (ne <= 0) continue;
        ctx.globalAlpha = (0.14 + lum * 0.72) * ne;
        ctx.beginPath();
        // Jamais de zéro : le point naît à 40 % de sa taille, en fondu.
        ctx.arc(x, y, pas * (0.1 + lum * 0.36) * (0.4 + 0.6 * ne), 0, Math.PI * 2);
        ctx.fill();
      }
      // Amorti vers la souris : la boucle s'arrête une fois la cible rejointe.
      const dx = cible.x - pos.x;
      const dy = cible.y - pos.y;
      const enRoute = Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002;
      if (!immobile && (enRoute || naissant)) {
        pos.x += dx * 0.12;
        pos.y += dy * 0.12;
        cadre = window.requestAnimationFrame(dessiner);
      }
    };
    const relancer = () => {
      if (!cadre && visible) cadre = window.requestAnimationFrame(dessiner);
    };

    img.onload = () => {
      rapport = img.naturalHeight / img.naturalWidth;
      relancer();
    };
    img.onerror = annoncer;
    img.src = src;

    const suivre = (e: PointerEvent) => {
      cible.x = (e.clientX / window.innerWidth - 0.5) * 2;
      cible.y = (e.clientY / window.innerHeight - 0.5) * 2;
      relancer();
    };
    const taille = new ResizeObserver(relancer);
    taille.observe(c);
    const vue = new IntersectionObserver(([entree]) => {
      visible = entree?.isIntersecting ?? true;
      relancer();
    });
    vue.observe(c);
    if (!immobile) window.addEventListener("pointermove", suivre, { passive: true });
    return () => {
      window.cancelAnimationFrame(cadre);
      window.removeEventListener("pointermove", suivre);
      taille.disconnect();
      vue.disconnect();
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);
  return <canvas ref={toile} aria-hidden data-part="hero-visage" className="block h-full w-full text-accent" />;
}
