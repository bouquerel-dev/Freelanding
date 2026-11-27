import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { FriseParcours } from "./FriseParcours";

/**
 * La frise dans jsdom : épinglée et parcourue au défilement sur ordinateur,
 * glissée au doigt ailleurs, ouverte sur aujourd'hui ; elle suit un
 * changement de largeur d'écran.
 */
let etat;

function installer({ ordinateur }) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
  const precedent = { window: globalThis.window, document: globalThis.document, ResizeObserver: globalThis.ResizeObserver };
  const w = dom.window;
  etat = { ecouteurs: [], observes: 0, deconnectes: 0, ordinateur };
  w.matchMedia = () => ({
    get matches() {
      return etat.ordinateur;
    },
    addEventListener: (_t, f) => etat.ecouteurs.push(f),
    removeEventListener: (_t, f) => {
      etat.ecouteurs = etat.ecouteurs.filter((x) => x !== f);
    },
  });
  Object.defineProperty(w.HTMLElement.prototype, "scrollWidth", { configurable: true, get: () => 3000 });
  Object.defineProperty(w.HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 1440 });
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.ResizeObserver = class {
    constructor(rappel) {
      etat.mesure = rappel;
    }
    observe() {
      etat.observes += 1;
    }
    disconnect() {
      etat.deconnectes += 1;
    }
  };
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  etat.restaurer = () => Object.assign(globalThis, precedent);
}

const etapes = [
  { etape: { structure: "École", periode: "2021", nature: "Bac+3", court: "BUT" }, ligne: "formation", debut: 0.1, fin: 0.5, enCours: false, rang: 0 },
  { etape: { structure: "Atelier", periode: "2023", nature: "Stage", href: "/realisations/x" }, ligne: "experience", debut: 0.3, fin: 0.35, enCours: false, rang: 1 },
  { etape: { structure: "Indépendant", periode: "Depuis 2026", nature: "Freelance" }, ligne: "experience", debut: 0.9, fin: 1, enCours: true, rang: 0 },
];
const lignes = { formation: "Formation", experience: "Expérience", enCours: "Aujourd’hui" };

async function monter() {
  const hote = document.createElement("div");
  document.body.append(hote);
  const racine = createRoot(hote);
  await act(async () => {
    racine.render(createElement(FriseParcours, { etapes, annees: [2021, 2022], aujourdhui: 0.95, lignes, entete: createElement("h2", null, "Titre") }));
  });
  etat.racine = racine;
  return hote;
}

afterEach(async () => {
  await act(async () => etat.racine?.unmount());
  etat.restaurer();
});

describe("FriseParcours", () => {
  it("sur ordinateur, fige la section sur la hauteur de ce qui déborde", async () => {
    installer({ ordinateur: true });
    const hote = await monter();
    const cadre = hote.firstElementChild;
    expect(cadre.style.height).toContain("1560px");
    expect(hote.querySelector(".sticky")).not.toBeNull();
    expect(etat.observes).toBe(1);
    await act(async () => etat.mesure());
    expect(hote.textContent).toContain("Indépendant");
    expect(hote.querySelector('a[href="/realisations/x"]')).not.toBeNull();
  });

  it("ailleurs, la piste glisse au doigt et s'ouvre sur aujourd'hui", async () => {
    installer({ ordinateur: false });
    const hote = await monter();
    const glisse = hote.querySelector(".frise-glisse");
    expect(glisse).not.toBeNull();
    expect(glisse.scrollLeft).toBe(3000);
    expect(hote.querySelector(".sticky")).toBeNull();
  });

  it("suit le passage d'un écran étroit à un écran large", async () => {
    installer({ ordinateur: false });
    const hote = await monter();
    etat.ordinateur = true;
    await act(async () => etat.ecouteurs.forEach((f) => f()));
    expect(hote.querySelector(".sticky")).not.toBeNull();
  });
});
