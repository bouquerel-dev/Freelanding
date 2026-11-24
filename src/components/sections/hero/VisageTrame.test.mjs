import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { VisageTrame } from "./VisageTrame";

/**
 * La trame du visage dans jsdom : pas de vraie toile, un contexte 2D simulé
 * qui compte les points tracés. Ce que ces tests gardent :
 *   - le fond volt de la photo est écarté, le reste devient des points ;
 *   - la photo garde son rapport (un point en haut à droite de la photo ne
 *     descend pas quand la toile s'allonge) ;
 *   - la toile ne tourne qu'en mouvement, et s'arrête au repos ou hors écran ;
 *   - en mouvement réduit, une seule image, aucune écoute de la souris ;
 *   - les pixels transparents (photo détourée) sont écartés comme le volt ;
 *   - la trame naît en vague depuis le visage et le dit à sa scène.
 */

/** Pixels de la photo simulée, ligne par ligne (4 x 2). */
const VOLT = [200, 220, 50, 255];
const VERT_SOMBRE = [100, 220, 50, 255];
const BLANC = [250, 250, 250, 255];
const NOIR = [10, 10, 10, 255];
/** Pixel détouré de la photo couleur : transparent. */
const TRANSPARENT = [0, 0, 0, 0];

let etat;

function installer({ reduit = false, contexte = true, horsEcran = true, largeur = 400, hauteur = 300, donneesCourtes = false, detouree = false } = {}) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    ResizeObserver: globalThis.ResizeObserver,
    IntersectionObserver: globalThis.IntersectionObserver,
  };
  etat = {
    images: [],
    images_rAF: [],
    arcs: [],
    taille: { largeur, hauteur },
    redimensionner: [],
    visibilite: [],
    ecoutes: 0,
    annulations: 0,
  };
  const w = dom.window;
  w.matchMedia = () => ({ matches: reduit });
  w.devicePixelRatio = 3;
  w.requestAnimationFrame = (rappel) => {
    etat.images_rAF.push(rappel);
    return etat.images_rAF.length;
  };
  w.cancelAnimationFrame = () => {
    etat.annulations += 1;
  };
  const ajouter = w.addEventListener.bind(w);
  w.addEventListener = (type, ...reste) => {
    if (type === "pointermove") etat.ecoutes += 1;
    return ajouter(type, ...reste);
  };
  w.Image = class {
    naturalWidth = 4;
    naturalHeight = 2;
    set src(valeur) {
      this.source = valeur;
      etat.images.push(this);
    }
  };
  Object.defineProperty(w.HTMLCanvasElement.prototype, "clientWidth", { get: () => etat.taille.largeur });
  Object.defineProperty(w.HTMLCanvasElement.prototype, "clientHeight", { get: () => etat.taille.hauteur });
  w.HTMLCanvasElement.prototype.getContext = function () {
    const principal = this.isConnected;
    if (principal && !contexte) return null;
    if (!principal && !horsEcran) return null;
    return {
      clearRect() {},
      beginPath() {},
      fill() {},
      drawImage() {},
      arc(x, y, r) {
        etat.arcs.push({ x, y, r });
      },
      getImageData(_x, _y, l, h) {
        const pixels = [];
        for (let j = 0; j < h; j += 1) {
          for (let i = 0; i < l; i += 1) {
            pixels.push(...[detouree ? TRANSPARENT : VOLT, VERT_SOMBRE, BLANC, NOIR][(i + j) % 4]);
          }
        }
        return { data: donneesCourtes ? pixels.slice(0, 8) : pixels };
      },
    };
  };
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.ResizeObserver = class {
    constructor(rappel) {
      etat.redimensionner.push(rappel);
    }
    observe() {}
    disconnect() {}
  };
  globalThis.IntersectionObserver = class {
    constructor(rappel) {
      etat.visibilite.push(rappel);
    }
    observe() {}
    disconnect() {}
  };
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  etat.restaurer = () => Object.assign(globalThis, precedent);
}

async function monter(props = {}, { scene = false } = {}) {
  const conteneur = document.createElement("div");
  if (scene) conteneur.dataset.scene = "true";
  document.body.appendChild(conteneur);
  etat.conteneur = conteneur;
  const racine = createRoot(conteneur);
  await act(async () => {
    racine.render(createElement(VisageTrame, { src: "/images/eliott-portrait-large.jpg", ...props }));
  });
  etat.racine = racine;
  return conteneur.querySelector("canvas");
}

/** Joue les images d'animation en attente, une génération à la fois. */
function jouer(max = 200) {
  let tours = 0;
  while (etat.images_rAF.length && tours < max) {
    const file = etat.images_rAF.splice(0);
    for (const rappel of file) rappel();
    tours += 1;
  }
  return tours;
}

function charger() {
  const img = etat.images.at(-1);
  img.onload();
}

afterEach(async () => {
  if (etat?.racine) await act(async () => etat.racine.unmount());
  etat?.restaurer();
});

describe("VisageTrame", () => {
  it("rend une toile décorative, sans rien dessiner avant la photo", async () => {
    installer();
    const toile = await monter();
    expect(toile.getAttribute("aria-hidden")).toBe("true");
    expect(toile.dataset.part).toBe("hero-visage");
    expect(etat.images[0].source).toBe("/images/eliott-portrait-large.jpg");
    // Redimensionnement avant chargement : la boucle part, ne trace rien.
    etat.redimensionner[0]();
    jouer();
    expect(etat.arcs).toHaveLength(0);
  });

  it("écarte le fond volt et garde le portrait en points", async () => {
    installer({ reduit: true });
    await monter();
    charger();
    jouer();
    expect(etat.arcs.length).toBeGreaterThan(0);
    // Un point sur deux colonnes et deux lignes, et un pixel sur quatre est volt.
    const toile = document.querySelector("canvas");
    expect(toile.width).toBe(800);
    expect(toile.height).toBe(600);
  });

  it("garde le rapport de la photo : la hauteur remplit la toile, la largeur suit", async () => {
    installer({ reduit: true, largeur: 200, hauteur: 100 });
    await monter();
    charger();
    jouer();
    const hauts = etat.arcs.map((a) => a.y);
    // Photo 4 x 2 (rapport 0,5) dans une toile de 100 px de haut, à deux images par pixel CSS.
    expect(Math.min(...hauts)).toBe(0);
    expect(Math.max(...hauts)).toBeLessThan(200);
    const avant = etat.arcs.length;
    // La toile s'allonge : les points ne s'étirent pas, ils restent sur la même grille verticale.
    etat.taille = { largeur: 200, hauteur: 200 };
    etat.redimensionner[0]();
    jouer();
    const nouveaux = etat.arcs.slice(avant);
    const ecarts = new Set(nouveaux.map((a) => a.y));
    expect(ecarts.size).toBeGreaterThan(1);
    expect(Math.max(...nouveaux.map((a) => a.y))).toBeLessThan(400);
  });

  it("ne trace rien sur une toile sans taille", async () => {
    installer({ reduit: true, largeur: 0 });
    await monter();
    charger();
    jouer();
    expect(etat.arcs).toHaveLength(0);
    etat.taille = { largeur: 100, hauteur: 0 };
    etat.redimensionner[0]();
    jouer();
    expect(etat.arcs).toHaveLength(0);
  });

  it("recadre sans tracer les points hors de la toile", async () => {
    installer({ reduit: true, largeur: 10, hauteur: 300 });
    await monter({ centreOrdinateur: 0.4 });
    charger();
    jouer();
    const toile = document.querySelector("canvas");
    for (const arc of etat.arcs) {
      expect(arc.x).toBeGreaterThan(-200);
      expect(arc.x).toBeLessThan(toile.width + 200);
    }
  });

  it("suit la souris avec un amorti, puis s'arrête au repos", async () => {
    installer();
    await monter();
    expect(etat.ecoutes).toBe(1);
    charger();
    jouer();
    const repos = etat.arcs.length;
    window.dispatchEvent(new window.MouseEvent("pointermove", { clientX: 1000, clientY: 0 }));
    // Deux mouvements avant la prochaine image : une seule boucle.
    window.dispatchEvent(new window.MouseEvent("pointermove", { clientX: 1000, clientY: 0 }));
    const tours = jouer();
    expect(tours).toBeGreaterThan(5);
    expect(tours).toBeLessThan(200);
    expect(etat.arcs.length).toBeGreaterThan(repos);
    expect(etat.images_rAF).toHaveLength(0);
    // Mouvement vertical seul : la boucle repart aussi.
    window.dispatchEvent(new window.MouseEvent("pointermove", { clientX: 1000, clientY: 768 }));
    expect(jouer()).toBeGreaterThan(5);
  });

  it("ne tourne pas hors écran, et repart quand la toile revient", async () => {
    installer();
    await monter();
    charger();
    jouer();
    etat.visibilite[0]([{ isIntersecting: false }]);
    window.dispatchEvent(new window.MouseEvent("pointermove", { clientX: 0, clientY: 0 }));
    expect(etat.images_rAF).toHaveLength(0);
    // Entrée absente : la toile est tenue pour visible.
    etat.visibilite[0]([]);
    expect(etat.images_rAF.length).toBeGreaterThan(0);
  });

  it("en mouvement réduit, une seule image et aucune écoute de la souris", async () => {
    installer({ reduit: true });
    await monter();
    charger();
    expect(jouer()).toBe(1);
    expect(etat.ecoutes).toBe(0);
  });

  it("se démonte proprement, boucle annulée", async () => {
    installer();
    await monter();
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    expect(etat.annulations).toBe(1);
  });

  it("tient sans contexte 2D, sans contexte hors écran et sur une image tronquée", async () => {
    installer({ contexte: false });
    await monter();
    expect(etat.images).toHaveLength(0);
    await act(async () => etat.racine.unmount());
    etat.restaurer();

    installer({ reduit: true, horsEcran: false });
    await monter();
    charger();
    jouer();
    expect(etat.arcs).toHaveLength(0);
    await act(async () => etat.racine.unmount());
    etat.restaurer();

    installer({ reduit: true, donneesCourtes: true });
    await monter();
    charger();
    jouer();
    expect(etat.arcs.length).toBeGreaterThan(0);
  });

  it("écarte les pixels transparents de la photo détourée", async () => {
    installer({ reduit: true, detouree: true });
    await monter();
    charger();
    jouer();
    const detouree = etat.arcs.length;
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    etat.restaurer();
    installer({ reduit: true });
    await monter();
    charger();
    jouer();
    // Même nombre de points : le pixel transparent tient la place du volt.
    expect(detouree).toBe(etat.arcs.length);
    expect(detouree).toBeGreaterThan(0);
  });

  it("naît en vague depuis le visage, et le dit à sa scène une seule fois", async () => {
    installer();
    await monter({}, { scene: true });
    charger();
    // Première image : aucun point encore né, la scène passe à « trame ».
    etat.images_rAF.splice(0).forEach((rappel) => rappel(1000));
    expect(etat.arcs).toHaveLength(0);
    expect(etat.conteneur.dataset.scene).toBe("trame");
    const depuis = etat.conteneur.dataset.trameDepuis;
    expect(Number(depuis)).toBeGreaterThan(0);
    // À mi-vague, des points naissants, plus petits que leur taille finale.
    etat.images_rAF.splice(0).forEach((rappel) => rappel(1200));
    const milieu = etat.arcs.splice(0);
    expect(milieu.length).toBeGreaterThan(0);
    // Vague finie : la boucle s'arrête d'elle-même, points à leur taille.
    etat.images_rAF.splice(0).forEach((rappel) => rappel(4000));
    const fin = etat.arcs.splice(0);
    expect(fin.length).toBeGreaterThanOrEqual(milieu.length);
    expect(Math.max(...fin.map((a) => a.r))).toBeGreaterThan(Math.max(...milieu.map((a) => a.r)));
    expect(etat.images_rAF).toHaveLength(0);
    expect(etat.conteneur.dataset.trameDepuis).toBe(depuis);
    // La photo arrivée, la trame ne réécrit plus l'état de la scène.
    etat.conteneur.dataset.scene = "photo";
    window.dispatchEvent(new window.MouseEvent("pointermove", { clientX: 10, clientY: 10 }));
    jouer();
    expect(etat.conteneur.dataset.scene).toBe("photo");
  });

  it("annonce la trame en mouvement réduit, et quand son image ne charge pas", async () => {
    installer({ reduit: true });
    await monter({}, { scene: true });
    charger();
    jouer();
    expect(etat.conteneur.dataset.scene).toBe("trame");
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    etat.restaurer();

    installer();
    await monter({}, { scene: true });
    etat.images.at(-1).onerror();
    expect(etat.conteneur.dataset.scene).toBe("trame");
  });
});
