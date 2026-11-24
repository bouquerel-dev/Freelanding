import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { schemaAccueil } from "@/content/schema";
import { SchemaSection } from "./SchemaSection";

/**
 * Le schéma vivant dans jsdom. Ce que ces tests gardent :
 *   - le cœur n'avance que quand la section est à l'écran, jamais hors écran ;
 *   - hors écran, la section est marquée `data-schema="pause"` (tirets figés) ;
 *   - sur ordinateur, la cascade d'entrée attend la première apparition ;
 *   - en mouvement réduit, ni cascade ni pas ;
 *   - changer d'onglet repart de la première étape et retrace les liens.
 */
let etat;

function installer({ reduit = false, ordinateur = true } = {}) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
  const precedent = { window: globalThis.window, document: globalThis.document, IntersectionObserver: globalThis.IntersectionObserver };
  etat = { visibilite: [], minuteries: [], delais: [], annules: [] };
  const w = dom.window;
  const requetes = { "(prefers-reduced-motion: reduce)": reduit, "(min-width: 1200px)": ordinateur };
  w.matchMedia = (q) => ({ matches: requetes[q] ?? false });
  w.setInterval = (rappel) => {
    etat.minuteries.push(rappel);
    return etat.minuteries.length;
  };
  w.clearInterval = (id) => {
    etat.minuteries[id - 1] = null;
  };
  w.setTimeout = (rappel) => {
    etat.delais.push(rappel);
    return 77;
  };
  w.clearTimeout = (id) => {
    etat.annules.push(id);
  };
  // La section est rendue sous l'écran, sauf demande contraire.
  w.HTMLElement.prototype.getBoundingClientRect = () => ({ top: etat.haut ?? 2000, left: 0, right: 0, bottom: 0, width: 0, height: 0 });
  w.innerHeight = 900;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.IntersectionObserver = class {
    constructor(rappel) {
      this.rappel = rappel;
    }
    observe(cible) {
      // Seul compte l'observateur de la section ; le grain a le sien.
      if (cible.tagName === "SECTION") etat.visibilite.push(this.rappel);
    }
    unobserve() {}
    disconnect() {}
  };
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  etat.restaurer = () => Object.assign(globalThis, precedent);
}

async function monter() {
  const hote = document.createElement("div");
  document.body.append(hote);
  const racine = createRoot(hote);
  await act(async () => racine.render(createElement(SchemaSection, { schema: schemaAccueil })));
  etat.racine = racine;
  etat.section = hote.querySelector("section");
  return hote;
}

const actives = () => etat.minuteries.filter(Boolean);
const voir = (dedans) => act(async () => etat.visibilite[0]([{ isIntersecting: dedans }]));
const action = () => etat.section.querySelector("p.min-h-\\[40px\\]").textContent;

afterEach(async () => {
  await act(async () => etat.racine?.unmount());
  etat.restaurer();
});

describe("SchemaSection, en vrai DOM", () => {
  it("attend d'être à l'écran pour avancer, et s'arrête dès qu'il le quitte", async () => {
    installer();
    await monter();
    expect(etat.section.dataset.vu).toBe("0");
    expect(actives()).toHaveLength(0);
    await voir(true);
    expect(etat.section.dataset.vu).toBe("1");
    expect(etat.section.dataset.schema).toBe("");
    expect(actives()).toHaveLength(1);
    const avant = action();
    await act(async () => actives()[0]());
    expect(action()).not.toBe(avant);
    await voir(false);
    expect(etat.section.dataset.schema).toBe("pause");
    expect(actives()).toHaveLength(0);
    // Une seconde apparition ne rejoue pas la cascade.
    await voir(true);
    expect(etat.section.dataset.vu).toBe("1");
    expect(etat.delais).toHaveLength(1);
    // Cascade finie : elle est retirée, un changement d'onglet ne la rejoue pas.
    etat.delais[0]();
    expect(etat.section.dataset.vu).toBe("2");
  });

  it("ne cache rien quand la section est déjà à l'écran au chargement", async () => {
    installer();
    etat.haut = 300;
    await monter();
    expect(etat.section.dataset.vu).toBeUndefined();
    await voir(true);
    expect(etat.section.dataset.vu).toBeUndefined();
    expect(actives()).toHaveLength(1);
  });

  it("annule la fin de cascade en attente quand il se démonte", async () => {
    installer();
    await monter();
    await voir(true);
    await act(async () => etat.racine.unmount());
    etat.racine = null;
    expect(etat.annules).toContain(77);
  });

  it("change d'onglet en repartant de la première étape", async () => {
    installer();
    await monter();
    await voir(true);
    await act(async () => actives()[0]());
    const onglets = etat.section.querySelectorAll('[role="tab"]');
    await act(async () => onglets[1].dispatchEvent(new window.MouseEvent("click", { bubbles: true })));
    expect(onglets[1].getAttribute("aria-selected")).toBe("true");
    expect(action()).toContain(schemaAccueil.modes[1].actions[0]);
    await act(async () => window.dispatchEvent(new window.Event("resize")));
    expect(etat.section.querySelectorAll("path.schema-lien").length).toBe(
      schemaAccueil.modes[1].entrees.length + schemaAccueil.modes[1].sorties.length,
    );
  });

  it("ne cache rien et n'avance pas en mouvement réduit", async () => {
    installer({ reduit: true });
    await monter();
    expect(etat.section.dataset.vu).toBeUndefined();
    await voir(true);
    expect(etat.section.dataset.vu).toBeUndefined();
    expect(actives()).toHaveLength(0);
  });

  it("ne cache rien sous 1200 px, où il n'y a pas de cascade", async () => {
    installer({ ordinateur: false });
    await monter();
    expect(etat.section.dataset.vu).toBeUndefined();
    await act(async () => etat.visibilite[0]([]));
    expect(etat.section.dataset.schema).toBe("pause");
  });
});
