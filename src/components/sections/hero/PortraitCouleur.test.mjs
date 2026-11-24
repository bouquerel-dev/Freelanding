import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { ATTENTE_TRAME_MS, animerPortrait, PASSAGE_MS, PortraitCouleur } from "./PortraitCouleur";

/**
 * Le portrait couleur dans jsdom. Ce que ces tests gardent :
 *   - la photo est demandée à toutes les tailles, téléphone compris ;
 *   - peinte dans la toile, elle attend la fin de la vague de la trame, puis la
 *     scène passe à « photo » et, le passage fini, à « lampe » ;
 *   - arrivée avant la trame, ou en mouvement réduit, elle passe sans attendre ;
 *   - sans contexte 2D ou démontée avant la fin, rien ne casse, rien ne reste.
 */

let etat;

function installer({ reduit = false, contexte = true } = {}) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
  const precedent = { window: globalThis.window, document: globalThis.document };
  const w = dom.window;
  etat = { images: [], dessins: 0, minuteurs: [], effaces: 0 };
  w.matchMedia = () => ({ matches: reduit });
  w.setTimeout = (f, ms) => {
    etat.minuteurs.push({ f, ms });
    return etat.minuteurs.length;
  };
  w.clearTimeout = () => {
    etat.effaces += 1;
  };
  w.Image = class {
    naturalWidth = 1024;
    naturalHeight = 1024;
    set src(v) {
      this.source = v;
      etat.images.push(this);
    }
  };
  w.HTMLCanvasElement.prototype.getContext = () =>
    contexte
      ? {
          drawImage() {
            etat.dessins += 1;
          },
        }
      : null;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  etat.restaurer = () => Object.assign(globalThis, precedent);
}

async function monter({ trameDepuis, sansScene = false } = {}) {
  const scene = document.createElement("div");
  if (!sansScene) scene.dataset.scene = "true";
  if (trameDepuis !== undefined) scene.dataset.trameDepuis = String(trameDepuis);
  document.body.append(scene);
  const racine = createRoot(scene);
  await act(async () => racine.render(createElement(PortraitCouleur, { src: "/images/eliott-portrait-couleur.webp" })));
  etat.racine = racine;
  etat.scene = scene;
  return scene.querySelector("canvas");
}

/** Joue les minuteurs en attente, dans l'ordre. */
function attendre() {
  while (etat.minuteurs.length) etat.minuteurs.shift().f();
}

afterEach(async () => {
  if (etat?.racine) await act(async () => etat.racine.unmount());
  etat?.restaurer();
});

describe("PortraitCouleur", () => {
  it("rend une toile décorative à toutes les tailles et demande la photo", async () => {
    installer();
    const t = await monter();
    expect(t.getAttribute("aria-hidden")).toBe("true");
    expect(t.className).toBe("hero-photo absolute inset-0 h-full w-full");
    expect(etat.images[0].source).toBe("/images/eliott-portrait-couleur.webp");
  });

  it("attend la fin de la vague de la trame, puis passe à « photo » puis à « lampe »", async () => {
    installer();
    const t = await monter({ trameDepuis: performance.now() });
    etat.images[0].onload();
    expect(etat.dessins).toBe(1);
    expect(t.width).toBe(1024);
    expect(t.dataset.pret).toBeUndefined();
    const [vague] = etat.minuteurs;
    expect(vague.ms).toBeGreaterThan(ATTENTE_TRAME_MS - 100);
    expect(vague.ms).toBeLessThanOrEqual(ATTENTE_TRAME_MS);
    etat.minuteurs.shift().f();
    expect(t.dataset.pret).toBe("1");
    expect(etat.scene.dataset.scene).toBe("photo");
    expect(etat.minuteurs[0].ms).toBe(PASSAGE_MS);
    attendre();
    expect(etat.scene.dataset.scene).toBe("lampe");
  });

  it("passe sans attendre quand la trame n'est pas née, ou en mouvement réduit", async () => {
    installer();
    await monter();
    etat.images[0].onload();
    expect(etat.minuteurs[0].ms).toBe(0);
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    etat.restaurer();

    installer({ reduit: true });
    await monter({ trameDepuis: performance.now() });
    etat.images[0].onload();
    expect(etat.minuteurs[0].ms).toBe(0);
    attendre();
    expect(etat.scene.dataset.scene).toBe("lampe");
  });

  it("tient sans contexte 2D, et se démonte avant la fin du chargement", async () => {
    installer({ contexte: false });
    const t = await monter();
    etat.images[0].onload();
    expect(t.dataset.pret).toBeUndefined();
    expect(etat.minuteurs).toHaveLength(0);
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    etat.restaurer();

    installer();
    await monter();
    const img = etat.images[0];
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    expect(img.onload).toBeNull();
  });

  it("démontée pendant l'attente, elle annule ses minuteurs sans toucher la scène", async () => {
    installer();
    await monter({ trameDepuis: performance.now() });
    etat.images[0].onload();
    const vague = etat.minuteurs.shift();
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    expect(etat.effaces).toBe(1);
    vague.f();
    expect(etat.scene.dataset.scene).toBe("true");
  });

  it("tient hors d'une scène, et sans toile", async () => {
    installer();
    const t = await monter({ sansScene: true });
    etat.images[0].onload();
    attendre();
    expect(t.dataset.pret).toBe("1");
    expect(etat.scene.dataset.scene).toBeUndefined();
    expect(animerPortrait(null, "/x.webp")).toBeUndefined();
  });
});
