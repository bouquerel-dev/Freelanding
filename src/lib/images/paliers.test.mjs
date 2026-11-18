import { describe, expect, test } from "bun:test";
import {
  DELAI_GRACE,
  ETAPES_ARRIVEE,
  deroulerChargement,
  tailleMiniature,
} from "./paliers.ts";

const GRACE = 20;
const dormir = (ms) => new Promise((fin) => setTimeout(fin, ms));
/** Le délai de grâce s'écoule vraiment, les étapes d'arrivée sans attendre. */
const attendre = (ms) => (ms === GRACE ? dormir(GRACE) : Promise.resolve());
const IMG = { nom: "image" };

function derouler({ estChargee = false, arriveeApres, echec = false }) {
  const montrees = [];
  const resultat = deroulerChargement({
    estChargee: () => estChargee,
    charger: () => dormir(arriveeApres).then(() => (echec ? null : IMG)),
    attendre,
    montrer: (etape) => montrees.push(etape),
    estAnnule: () => false,
    grace: GRACE,
  });
  return resultat.then((issue) => ({ issue, montrees }));
}

describe("deroulerChargement", () => {
  test("image déjà chargée : rien de pixelisé, elle s'affiche nette", async () => {
    const { issue, montrees } = await derouler({ estChargee: true, arriveeApres: 0 });
    expect(issue).toBe("nette");
    expect(montrees).toEqual([]);
  });

  test("image arrivée dans le délai de grâce : rien de pixelisé", async () => {
    const { issue, montrees } = await derouler({ arriveeApres: 0 });
    expect(issue).toBe("nette");
    expect(montrees).toEqual([]);
  });

  test("image en retard : l'attente en 32 px, puis des étapes courtes jusqu'à la nette", async () => {
    const { issue, montrees } = await derouler({ arriveeApres: GRACE * 3 });
    expect(issue).toBe("attente");
    expect(montrees).toEqual([
      { type: "attente" },
      ...ETAPES_ARRIVEE.map((colonnes) => ({ type: "arrivee", img: IMG, colonnes })),
      null,
    ]);
  });

  test("image en retard qui échoue : l'attente, puis plus rien de pixelisé", async () => {
    const { montrees } = await derouler({ arriveeApres: GRACE * 3, echec: true });
    expect(montrees).toEqual([{ type: "attente" }, null]);
  });

  test("étape illisible (toile d'une autre origine) : droit à l'image nette", async () => {
    const montrees = [];
    await deroulerChargement({
      estChargee: () => false,
      charger: () => dormir(GRACE * 3).then(() => IMG),
      attendre,
      montrer: (etape) => {
        if (etape?.type === "arrivee") throw new Error("toile illisible");
        montrees.push(etape);
      },
      estAnnule: () => false,
      grace: GRACE,
    });
    expect(montrees).toEqual([{ type: "attente" }, null]);
  });

  test("annulé pendant les étapes : on s'arrête, sans rien montrer de plus", async () => {
    const montrees = [];
    let annule = false;
    await deroulerChargement({
      estChargee: () => false,
      charger: () => dormir(GRACE * 3).then(() => IMG),
      attendre,
      montrer: (etape) => {
        montrees.push(etape);
        if (etape?.type === "arrivee") annule = true;
      },
      estAnnule: () => annule,
      grace: GRACE,
    });
    expect(montrees).toEqual([
      { type: "attente" },
      { type: "arrivee", img: IMG, colonnes: ETAPES_ARRIVEE[0] },
    ]);
  });

  test("annulé pendant le délai de grâce : rien de pixelisé", async () => {
    const montrees = [];
    let annule = false;
    const issue = await deroulerChargement({
      estChargee: () => false,
      charger: () => new Promise(() => {}),
      attendre: (ms) => attendre(ms).then(() => { annule = true; }),
      montrer: (etape) => montrees.push(etape),
      estAnnule: () => annule,
      grace: GRACE,
    });
    expect(issue).toBe("nette");
    expect(montrees).toEqual([]);
  });

  test("délai de grâce par défaut entre 150 et 250 ms", () => {
    expect(DELAI_GRACE).toBeGreaterThanOrEqual(150);
    expect(DELAI_GRACE).toBeLessThanOrEqual(250);
  });
});

describe("tailleMiniature", () => {
  test("garde le rapport de l'image", () => {
    expect(tailleMiniature(16, 1600, 900)).toEqual({ largeur: 16, hauteur: 9 });
  });

  test("jamais sous un pixel de haut", () => {
    expect(tailleMiniature(8, 4000, 100)).toEqual({ largeur: 8, hauteur: 1 });
  });

  test("dimensions inconnues : carré", () => {
    expect(tailleMiniature(8, 0, 0)).toEqual({ largeur: 8, hauteur: 8 });
  });
});
