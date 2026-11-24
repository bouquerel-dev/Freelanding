import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { AmbianceHeros } from "./AmbianceHeros";

/**
 * Le fond vivant du héros dans jsdom. Ce que ces tests gardent :
 *   - la lampe suit la souris avec un amorti et s'arrête quand elle l'a rejointe ;
 *   - elle naît sous la souris et rend la main à la ronde quand la souris sort ;
 *   - hors écran, la section est mise en pause et la boucle annulée ;
 *   - mouvement réduit ou pointeur tactile : aucune écoute de la souris ;
 *   - sous 1200 px, la souris est ignorée.
 */
let etat;

function installer({ reduit = false, fin = true, ordinateur = true } = {}) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
  const precedent = { window: globalThis.window, document: globalThis.document, IntersectionObserver: globalThis.IntersectionObserver };
  etat = { images: [], annulations: 0, visibilite: [], deconnexions: 0 };
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
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  etat.restaurer = () => Object.assign(globalThis, precedent);
}

async function monter({ dansSection = true } = {}) {
  const hote = document.createElement(dansSection ? "section" : "div");
  document.body.append(hote);
  const racine = createRoot(hote);
  await act(async () => racine.render(createElement(AmbianceHeros)));
  etat.racine = racine;
  etat.section = hote;
  etat.lampe = hote.querySelector(".amb-lampe");
  etat.motif = hote.querySelector(".amb-lampe-motif");
  return hote;
}

function jouer(max = 500) {
  let n = 0;
  while (etat.images.length && n < max) {
    const rappel = etat.images.shift();
    rappel(0);
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
  it("rend un décor caché sur téléphone, sans rien bouger au montage", async () => {
    installer();
    const s = await monter();
    const decor = s.querySelector('[data-part="hero-ambiance"]');
    expect(decor.getAttribute("aria-hidden")).toBe("true");
    expect(decor.className).toContain("hidden desktop:block");
    expect(etat.images).toHaveLength(0);
  });

  it("fait naître la lampe sous la souris puis la suit avec un amorti, jusqu'à l'arrêt", async () => {
    installer();
    await monter();
    souris(400, 350);
    expect(etat.section.dataset.pointeur).toBe("1");
    expect(etat.lampe.style.transform).toBe("translate3d(300px, 300px, 0)");
    expect(etat.motif.style.transform).toBe("translate3d(-300px, -300px, 0)");
    jouer();
    souris(600, 350);
    expect(etat.images).toHaveLength(1);
    // Un seul rAF en vol, même si la souris bouge encore.
    souris(600, 350);
    expect(etat.images).toHaveLength(1);
    etat.images.shift()(0);
    expect(etat.lampe.style.transform).toBe("translate3d(316px, 300px, 0)");
    const images = jouer();
    expect(images).toBeGreaterThan(10);
    expect(images).toBeLessThan(500);
    expect(etat.lampe.style.transform).toBe("translate3d(500px, 300px, 0)");
    expect(etat.images).toHaveLength(0);
  });

  it("rend la main à la ronde quand la souris quitte le héros", async () => {
    installer();
    await monter();
    souris(400, 350);
    etat.section.dispatchEvent(new window.Event("pointerleave"));
    expect(etat.section.dataset.pointeur).toBe("");
  });

  it("met la section en pause hors écran et annule la boucle en vol", async () => {
    installer();
    await monter();
    souris(400, 350);
    souris(900, 700);
    expect(etat.images).toHaveLength(1);
    etat.visibilite[0]([{ isIntersecting: false }]);
    expect(etat.section.dataset.ambiance).toBe("pause");
    expect(etat.annulations).toBe(1);
    etat.images.length = 0;
    souris(200, 200);
    expect(etat.images).toHaveLength(0);
    etat.visibilite[0]([{ isIntersecting: true }]);
    expect(etat.section.dataset.ambiance).toBe("");
    etat.visibilite[0]([{ isIntersecting: false }]);
    expect(etat.annulations).toBe(1);
    etat.visibilite[0]([]);
    expect(etat.section.dataset.ambiance).toBe("pause");
  });

  it("ignore la souris sous 1200 px", async () => {
    installer({ ordinateur: false });
    await monter();
    souris(400, 350);
    expect(etat.section.dataset.pointeur).toBeUndefined();
    expect(etat.images).toHaveLength(0);
  });

  it("n'écoute pas la souris en mouvement réduit ni au doigt", async () => {
    for (const options of [{ reduit: true }, { fin: false }]) {
      installer(options);
      await monter();
      souris(400, 350);
      expect(etat.section.dataset.pointeur).toBeUndefined();
      await act(async () => etat.racine.unmount());
      etat.racine = null;
      etat.restaurer();
    }
    installer();
  });

  it("ne fait rien hors d'une section, et se défait proprement", async () => {
    installer();
    await monter({ dansSection: false });
    expect(etat.visibilite).toHaveLength(0);
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    await monter();
    souris(400, 350);
    souris(900, 700);
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    expect(etat.deconnexions).toBe(1);
    expect(etat.annulations).toBe(1);
  });
});
