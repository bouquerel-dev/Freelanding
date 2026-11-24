import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { AmbianceHeros } from "./AmbianceHeros";

/**
 * Le fond vivant du héros (fils) dans jsdom. Ce que ces tests gardent :
 *   - les fils se tracent dès le montage, un trait par fil ;
 *   - la lampe naît sous la souris et éclaire la trame dans son repère ;
 *   - quand la souris sort, la trame s'éteint ;
 *   - hors écran, la section est mise en pause et la boucle annulée ;
 *   - mouvement réduit : une seule image, aucune écoute de la souris ;
 *   - au doigt, une image sur deux une fois les fils tissés ;
 *   - sous 1200 px, la souris est ignorée.
 */
let etat;

function installer({ reduit = false, fin = true, ordinateur = true, contexte = true } = {}) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    IntersectionObserver: globalThis.IntersectionObserver,
    ResizeObserver: globalThis.ResizeObserver,
  };
  etat = { images: [], annulations: 0, visibilite: [], deconnexions: 0, traits: 0, tailles: [] };
  const w = dom.window;
  const requetes = { "(prefers-reduced-motion: reduce)": reduit, "(hover: hover) and (pointer: fine)": fin, "(min-width: 1200px)": ordinateur };
  w.matchMedia = (q) => ({ matches: requetes[q] ?? false });
  w.requestAnimationFrame = (rappel) => {
    etat.images.push(rappel);
    return etat.images.length;
  };
  w.cancelAnimationFrame = () => {
    etat.annulations += 1;
  };
  w.HTMLCanvasElement.prototype.getContext = () =>
    contexte
      ? {
          setTransform() {},
          clearRect() {},
          beginPath() {},
          moveTo() {},
          lineTo() {},
          stroke() {
            etat.traits += 1;
          },
        }
      : null;
  Object.defineProperty(w.HTMLCanvasElement.prototype, "clientWidth", { configurable: true, get: () => etat.largeur ?? 1000 });
  Object.defineProperty(w.HTMLCanvasElement.prototype, "clientHeight", { configurable: true, get: () => etat.hauteur ?? 220 });
  w.HTMLElement.prototype.getBoundingClientRect = () => ({ left: 100, top: 50, width: 1000, height: 800 });
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.IntersectionObserver = class {
    constructor(rappel) {
      etat.visibilite.push(rappel);
    }
    observe() {}
    disconnect() {
      etat.deconnexions += 1;
    }
  };
  globalThis.ResizeObserver = class {
    constructor(rappel) {
      etat.tailles.push(rappel);
    }
    observe() {}
    disconnect() {
      etat.deconnexions += 1;
    }
  };
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  etat.restaurer = () => Object.assign(globalThis, precedent);
}

async function monter({ dansSection = true, visage = false } = {}) {
  const hote = document.createElement(dansSection ? "section" : "div");
  document.body.append(hote);
  let conteneur = hote;
  if (visage) {
    // La trame du visage, décalée de 600 px et 150 px dans le héros.
    const v = document.createElement("div");
    v.className = "hero-visage";
    v.getBoundingClientRect = () => ({ left: 700, top: 200, width: 400, height: 500 });
    conteneur = document.createElement("div");
    hote.append(v, conteneur);
    etat.visage = v;
  }
  const racine = createRoot(conteneur);
  await act(async () => racine.render(createElement(AmbianceHeros)));
  etat.racine = racine;
  etat.section = hote;
  return hote;
}

/** Joue `max` images au plus, à 16 ms d'écart à partir de `depuis`. */
function jouer(max = 60, depuis = 0) {
  let n = 0;
  while (etat.images.length && n < max) {
    const rappel = etat.images.shift();
    rappel(depuis + n * 16);
    n += 1;
  }
  return n;
}

function souris(x, y) {
  const e = new window.Event("pointermove");
  Object.assign(e, { clientX: x, clientY: y });
  etat.section.dispatchEvent(e);
}

afterEach(async () => {
  await act(async () => etat.racine?.unmount());
  etat.restaurer();
});

describe("AmbianceHeros", () => {
  it("rend un décor de fils, tracés dès le montage, un trait par fil", async () => {
    installer();
    const section = await monter();
    const decor = section.querySelector('[data-part="hero-ambiance"]');
    expect(decor.getAttribute("aria-hidden")).toBe("true");
    expect(section.querySelector("canvas.amb-fils")).not.toBeNull();
    expect(section.querySelector(".amb-halo")).not.toBeNull();
    jouer(1);
    // 220 px de haut, un fil tous les 22 px, plus deux en marge.
    expect(etat.traits).toBe(12);
    // La boucle continue : les fils ondulent.
    expect(etat.images).toHaveLength(1);
  });

  it("fait naître la lampe sous la souris et éclaire la trame dans son repère", async () => {
    installer();
    await monter({ visage: true });
    jouer(2);
    expect(etat.visage.style.getPropertyValue("--lx")).toBe("");
    souris(500, 300);
    expect(etat.section.dataset.pointeur).toBe("1");
    jouer(1);
    // Souris à (400, 250) dans le héros, visage décalé de (600, 150).
    expect(etat.visage.style.getPropertyValue("--lx")).toBe("-200px");
    expect(etat.visage.style.getPropertyValue("--ly")).toBe("100px");
    // Puis elle suit avec un amorti, sans sauter.
    souris(600, 300);
    jouer(1);
    const lx = Number.parseFloat(etat.visage.style.getPropertyValue("--lx"));
    expect(lx).toBeGreaterThan(-200);
    expect(lx).toBeLessThan(-100);
  });

  it("éteint la trame quand la souris quitte le héros", async () => {
    installer();
    await monter({ visage: true });
    souris(500, 300);
    jouer(1);
    etat.section.dispatchEvent(new window.Event("pointerleave"));
    expect(etat.section.dataset.pointeur).toBe("");
    expect(etat.visage.style.getPropertyValue("--lx")).toBe("");
    jouer(3);
    expect(etat.visage.style.getPropertyValue("--lx")).toBe("");
  });

  it("met la section en pause hors écran, annule la boucle et repart au retour", async () => {
    installer();
    await monter();
    jouer(1);
    etat.visibilite[0]([{ isIntersecting: false }]);
    expect(etat.section.dataset.ambiance).toBe("pause");
    expect(etat.annulations).toBe(1);
    etat.images.length = 0;
    jouer();
    souris(500, 300);
    expect(etat.images).toHaveLength(0);
    // Entrée absente : tenue pour visible, la boucle repart.
    etat.visibilite[0]([]);
    expect(etat.section.dataset.ambiance).toBe("");
    expect(etat.images).toHaveLength(1);
    // Un redimensionnement ne double pas la boucle.
    etat.tailles[0]();
    expect(etat.images).toHaveLength(1);
  });

  it("ignore la souris sous 1200 px", async () => {
    installer({ ordinateur: false });
    await monter({ visage: true });
    souris(500, 300);
    jouer(2);
    expect(etat.section.dataset.pointeur).toBeUndefined();
    expect(etat.visage.style.getPropertyValue("--lx")).toBe("");
  });

  it("en mouvement réduit, une seule image et aucune écoute de la souris", async () => {
    installer({ reduit: true });
    await monter();
    expect(jouer()).toBe(1);
    expect(etat.traits).toBe(12);
    souris(500, 300);
    expect(etat.section.dataset.pointeur).toBeUndefined();
    expect(etat.images).toHaveLength(0);
  });

  it("au doigt, n'écoute pas la souris et ne trace qu'une image sur deux une fois tissé", async () => {
    installer({ fin: false });
    await monter();
    souris(500, 300);
    expect(etat.section.dataset.pointeur).toBeUndefined();
    // Pendant le tissage, chaque image trace.
    jouer(2, 0);
    expect(etat.traits).toBe(24);
    // Après le tissage (1,6 s), une image sur deux seulement.
    etat.traits = 0;
    jouer(4, 2000);
    expect(etat.traits).toBe(24);
    expect(etat.images).toHaveLength(1);
  });

  it("ne trace rien sur une toile sans taille, sans contexte 2D ni hors d'une section", async () => {
    installer();
    etat.largeur = 0;
    await monter();
    jouer(1);
    expect(etat.traits).toBe(0);
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    etat.restaurer();

    installer({ contexte: false });
    await monter();
    expect(etat.images).toHaveLength(0);
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    etat.restaurer();

    installer();
    await monter({ dansSection: false });
    expect(etat.images).toHaveLength(0);
    expect(etat.visibilite).toHaveLength(0);
  });

  it("se défait proprement : observateurs coupés, boucle annulée", async () => {
    installer();
    await monter();
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    expect(etat.deconnexions).toBe(2);
    expect(etat.annulations).toBe(1);
    souris(500, 300);
    expect(etat.section.dataset.pointeur).toBeUndefined();
  });

  it("compte le temps en images quand le navigateur ne le donne pas, et tient sans densité d'écran ni hauteur", async () => {
    installer();
    window.devicePixelRatio = 0;
    await monter();
    etat.images.shift()();
    expect(etat.traits).toBe(12);
    etat.hauteur = 0;
    etat.traits = 0;
    etat.images.shift()();
    expect(etat.traits).toBe(0);
  });
});
