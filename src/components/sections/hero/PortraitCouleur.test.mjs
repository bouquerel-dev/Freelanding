import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { PortraitCouleur } from "./PortraitCouleur";

/**
 * Le portrait couleur dans jsdom. Ce que ces tests gardent :
 *   - sur téléphone, aucune image n'est demandée (la trame reste seule) ;
 *   - sur ordinateur, la photo est peinte dans la toile, qui passe « prête » ;
 *   - une fenêtre élargie au-delà de 1 200 px charge la photo à ce moment-là ;
 *   - sans contexte 2D ou démonté avant la fin du chargement, rien ne casse.
 */

let etat;

function installer({ ordinateur = true, contexte = true } = {}) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
  const precedent = { window: globalThis.window, document: globalThis.document };
  const w = dom.window;
  etat = { images: [], dessins: 0, ecoutes: new Set(), requete: { matches: ordinateur } };
  etat.requete.addEventListener = (_t, f) => etat.ecoutes.add(f);
  etat.requete.removeEventListener = (_t, f) => etat.ecoutes.delete(f);
  w.matchMedia = () => etat.requete;
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

async function monter() {
  const c = document.createElement("div");
  document.body.append(c);
  const racine = createRoot(c);
  await act(async () => racine.render(createElement(PortraitCouleur, { src: "/images/eliott-portrait-couleur.webp" })));
  etat.racine = racine;
  return c.querySelector("canvas");
}

afterEach(async () => {
  if (etat?.racine) await act(async () => etat.racine.unmount());
  etat?.restaurer();
});

describe("PortraitCouleur", () => {
  it("rend une toile décorative, réservée à l'ordinateur", async () => {
    installer({ ordinateur: false });
    const t = await monter();
    expect(t.getAttribute("aria-hidden")).toBe("true");
    expect(t.className).toContain("hero-photo absolute hidden desktop:block");
    expect(etat.images).toHaveLength(0);
  });

  it("peint la photo dans la toile sur ordinateur", async () => {
    installer();
    const t = await monter();
    expect(etat.images[0].source).toBe("/images/eliott-portrait-couleur.webp");
    etat.images[0].onload();
    expect(etat.dessins).toBe(1);
    expect(t.width).toBe(1024);
    expect(t.dataset.pret).toBe("1");
  });

  it("charge la photo quand la fenêtre passe sur ordinateur, une seule fois", async () => {
    installer({ ordinateur: false });
    await monter();
    etat.requete.matches = true;
    for (const f of etat.ecoutes) f();
    for (const f of etat.ecoutes) f();
    expect(etat.images).toHaveLength(1);
  });

  it("tient sans contexte 2D, et se démonte avant la fin du chargement", async () => {
    installer({ contexte: false });
    const t = await monter();
    etat.images[0].onload();
    expect(t.dataset.pret).toBeUndefined();
    const img = etat.images[0];
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    expect(img.onload).toBeNull();
    expect(etat.ecoutes.size).toBe(0);
  });
});
