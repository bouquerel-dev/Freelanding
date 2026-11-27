import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { DECOUPE_DEPART, Ouverture } from "./Ouverture";

/**
 * Le fond qui s'ouvre au défilement, monté dans jsdom. Ce que ces tests
 * gardent : en mouvement normal, le fond part découpé en panneau arrondi et le
 * filet part replié ; en mouvement réduit, fond plein et filet entier, sans
 * aucun style animé ; sans couleur de filet, pas de filet.
 */
let restaurer;
let racine;

function installer({ reduit }) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
  const w = dom.window;
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    self: globalThis.self,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };
  w.matchMedia = (q) => ({
    matches: q === "(prefers-reduced-motion: reduce)" ? reduit : false,
    addEventListener() {},
    removeEventListener() {},
  });
  globalThis.window = w;
  globalThis.document = w.document;
  // motion lit `self` et planifie ses mesures par images.
  globalThis.self = w;
  globalThis.requestAnimationFrame = (rappel) => setTimeout(() => rappel(Date.now()), 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  restaurer = () => Object.assign(globalThis, precedent);
  return w.document;
}

async function monter(props, options) {
  const doc = installer(options);
  const hote = doc.createElement("div");
  doc.body.appendChild(hote);
  racine = createRoot(hote);
  await act(async () => {
    racine.render(createElement(Ouverture, props));
  });
  await act(async () => {
    await new Promise((fin) => setTimeout(fin, 10));
  });
  return hote;
}

afterEach(async () => {
  await act(async () => racine?.unmount());
  racine = undefined;
  restaurer?.();
});

describe("Ouverture", () => {
  it("en mouvement normal, découpe le fond et replie le filet", async () => {
    const hote = await monter({ fond: "bg-accent", autour: "bg-papier", filet: "bg-background/10" }, { reduit: false });
    const couche = hote.querySelector("[data-part=ouverture]");
    expect(couche.getAttribute("aria-hidden")).toBe("true");
    expect(couche.className).toContain("bg-papier");
    const [fond, filet] = couche.children;
    expect(fond.className).toContain("bg-accent");
    expect(fond.style.clipPath).toBe(DECOUPE_DEPART);
    expect(filet.className).toContain("bg-background/10");
    expect(filet.style.transform).toContain("scaleY(0)");
  });

  it("en mouvement réduit, fond plein et filet entier", async () => {
    const hote = await monter({ fond: "bg-accent", autour: "bg-papier", filet: "bg-background/10" }, { reduit: true });
    const [fond, filet] = hote.querySelector("[data-part=ouverture]").children;
    expect(fond.style.clipPath).toBe("");
    expect(filet.style.transform).toBe("");
  });

  it("sans couleur de filet, ne dessine pas de filet", async () => {
    const hote = await monter({ fond: "bg-accent", autour: "bg-papier" }, { reduit: false });
    expect(hote.querySelector("[data-part=ouverture]").children.length).toBe(1);
  });
});
