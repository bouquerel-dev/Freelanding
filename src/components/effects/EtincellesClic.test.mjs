import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { EtincellesClic } from "./EtincellesClic";

/*
 * Étincelles au clic : rien avant le premier clic souris, rien au doigt ni en
 * mouvement réduit, boucle d'images arrêtée dès la fin de l'éclat.
 */
let dom;
let racine;
let conteneur;
let images;
let maintenant;
let traits;
let souris;
const precedent = {};

function cliquer(options = {}) {
  const evenement = new dom.window.Event("pointerdown", { bubbles: true });
  Object.assign(evenement, { pointerType: "mouse", button: 0, clientX: 40, clientY: 30, ...options });
  dom.window.document.dispatchEvent(evenement);
}

/** Joue les images en attente, l'horloge avancée de `pas` ms à chacune. */
function jouer(pas = 100) {
  while (images.length > 0) {
    const lot = images.splice(0);
    maintenant += pas;
    for (const rappel of lot) rappel(maintenant);
  }
}

beforeEach(async () => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
  for (const cle of ["window", "document", "requestAnimationFrame", "cancelAnimationFrame", "getComputedStyle"]) {
    precedent[cle] = globalThis[cle];
  }
  precedent.now = performance.now;
  images = [];
  maintenant = 1_000;
  traits = 0;
  souris = true;
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  dom.window.matchMedia = () => ({ get matches() { return souris; } });
  globalThis.requestAnimationFrame = (rappel) => images.push(rappel);
  globalThis.cancelAnimationFrame = () => {
    images = [];
  };
  performance.now = () => maintenant;
  dom.window.HTMLCanvasElement.prototype.getContext = () => ({
    setTransform() {},
    clearRect() {},
    beginPath() {},
    moveTo() {
      traits += 1;
    },
    lineTo() {},
    stroke() {},
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  conteneur = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(conteneur);
  racine = createRoot(conteneur);
  await act(async () => racine.render(createElement(EtincellesClic)));
});

afterEach(async () => {
  await act(async () => racine.unmount());
  for (const [cle, valeur] of Object.entries(precedent)) {
    if (cle === "now") performance.now = valeur;
    else globalThis[cle] = valeur;
  }
});

const canevas = () => dom.window.document.querySelector("canvas.etincelles-clic");

describe("EtincellesClic", () => {
  it("ne crée rien avant le premier clic", () => {
    expect(canevas()).toBeNull();
    expect(images).toHaveLength(0);
  });

  it("au clic souris : un canevas, huit traits, puis la boucle s'arrête", () => {
    cliquer();
    expect(canevas()).not.toBeNull();
    expect(canevas().getAttribute("aria-hidden")).toBe("true");
    expect(images).toHaveLength(1);
    jouer();
    expect(traits).toBeGreaterThanOrEqual(8);
    expect(images).toHaveLength(0);
  });

  it("deux clics rapprochés partagent une seule boucle et un seul canevas", () => {
    cliquer();
    cliquer({ clientX: 90 });
    expect(images).toHaveLength(1);
    jouer(50);
    expect(dom.window.document.querySelectorAll("canvas.etincelles-clic")).toHaveLength(1);
  });

  it("le canevas suit la taille de la fenêtre au clic suivant", () => {
    cliquer();
    jouer();
    const largeur = canevas().width;
    dom.window.innerWidth = largeur + 200;
    cliquer();
    expect(canevas().width).toBe(largeur + 200);
  });

  it("rien au doigt, au clic droit ni en mouvement réduit", () => {
    cliquer({ pointerType: "touch" });
    cliquer({ button: 2 });
    souris = false;
    cliquer();
    expect(canevas()).toBeNull();
  });

  it("lit le volt du site et tient sans densité d'écran déclarée", () => {
    dom.window.document.documentElement.style.setProperty("--accent", "#abcdef");
    dom.window.devicePixelRatio = 0;
    cliquer();
    expect(canevas().width).toBe(dom.window.innerWidth);
    jouer();
    expect(images).toHaveLength(0);
  });

  it("sans contexte 2D, rien n'est dessiné et rien ne casse", () => {
    dom.window.HTMLCanvasElement.prototype.getContext = () => null;
    cliquer();
    jouer();
    expect(traits).toBe(0);
  });

  it("au démontage : écouteur retiré, boucle annulée, canevas enlevé", async () => {
    cliquer();
    await act(async () => racine.unmount());
    expect(canevas()).toBeNull();
    expect(images).toHaveLength(0);
    cliquer();
    expect(canevas()).toBeNull();
    racine = createRoot(conteneur);
  });
});
