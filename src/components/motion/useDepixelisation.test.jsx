import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement, useRef } from "react";
import { createRoot } from "react-dom/client";
import { hasReducedMotionListener, prefersReducedMotion } from "motion-dom";

import { useAfficheDepixelisee, useDepixelisation } from "./useDepixelisation";

/**
 * La pixelisation est un ÉTAT DE CHARGEMENT : rien de pixelisé quand l'image
 * est déjà là ou arrive dans le délai de grâce, l'attente en 32 px sinon.
 * DOM réel (jsdom) : `IntersectionObserver` et la toile sont remplacés pour
 * décider de l'entrée dans l'écran et lire les miniatures.
 */
let entrerDansEcran = () => {};

function installerDom({ reduit = false, largeur = 400 } = {}) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    IntersectionObserver: globalThis.IntersectionObserver,
  };
  // `motion` garde sa préférence dans un état de module, lu au rendu : on la
  // pose directement, comme le ferait son écoute de `prefers-reduced-motion`.
  hasReducedMotionListener.current = true;
  prefersReducedMotion.current = reduit;
  dom.window.HTMLElement.prototype.getBoundingClientRect = () => ({ width: largeur });
  dom.window.HTMLCanvasElement.prototype.getContext = () => ({ drawImage() {} });
  dom.window.HTMLCanvasElement.prototype.toDataURL = function () {
    return `data:mini-${this.width}`;
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IntersectionObserver = class {
    constructor(rappel) {
      this.rappel = rappel;
      entrerDansEcran = () => this.rappel([{ isIntersecting: true }]);
    }
    observe() {}
    disconnect() {}
  };
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  return () => Object.assign(globalThis, precedent);
}


const dormir = (ms) => new Promise((fin) => setTimeout(fin, ms));

function Image({ estChargee, charger, src = "/work/projet.jpg", actif = true }) {
  const cible = useRef(null);
  const etape = useDepixelisation({ cible, src, actif, estChargee, charger });
  return <div ref={cible} data-etape={etape ?? ""} />;
}

function Affiche() {
  const video = useRef(null);
  const style = useAfficheDepixelisee({
    video,
    src: "/work/affiche.jpg",
    url: "/_next/image?url=%2Fwork%2Faffiche.jpg&w=1080&q=75",
    className: "object-contain",
  });
  return (
    <video
      ref={video}
      data-fond={style?.backgroundImage ?? ""}
      data-taille={style?.backgroundSize ?? ""}
    />
  );
}

async function monter(element) {
  const conteneur = document.createElement("div");
  document.body.append(conteneur);
  const racine = createRoot(conteneur);
  await act(async () => racine.render(element));
  return { conteneur, racine };
}

const etape = (conteneur) => conteneur.firstElementChild.getAttribute("data-etape");

describe("useDepixelisation", () => {
  let restaurer = () => {};
  afterEach(() => restaurer());

  it("mouvement réduit : jamais d'étape", async () => {
    restaurer = installerDom({ reduit: true });
    const { conteneur, racine } = await monter(
      createElement(Image, { estChargee: () => false, charger: () => new Promise(() => {}) }),
    );
    await act(async () => {
      entrerDansEcran();
      await dormir(260);
    });
    expect(etape(conteneur)).toBe("");
    await act(async () => racine.unmount());
  });

  it("image déjà chargée : rien de pixelisé", async () => {
    restaurer = installerDom();
    const { conteneur, racine } = await monter(
      createElement(Image, { estChargee: () => true, charger: () => new Promise(() => {}) }),
    );
    await act(async () => {
      entrerDansEcran();
      await dormir(260);
    });
    expect(etape(conteneur)).toBe("");
    await act(async () => racine.unmount());
  });

  it("image en retard : l'attente en 32 px, puis les étapes, puis l'image nette", async () => {
    restaurer = installerDom();
    let arriver = () => {};
    const img = { naturalWidth: 1600, naturalHeight: 900 };
    const { conteneur, racine } = await monter(
      createElement(Image, {
        estChargee: () => false,
        charger: () => new Promise((fin) => (arriver = () => fin(img))),
      }),
    );
    await act(async () => {
      entrerDansEcran();
      await dormir(260);
    });
    expect(etape(conteneur)).toContain("w=32");

    const vues = new Set();
    await act(async () => arriver());
    for (let i = 0; i < 30; i += 1) {
      await act(async () => dormir(10));
      vues.add(etape(conteneur));
    }
    expect([...vues].filter((v) => v.startsWith("data:"))).toEqual([
      "data:mini-48",
      "data:mini-96",
      "data:mini-128",
    ]);
    expect(etape(conteneur)).toBe("");
    await act(async () => racine.unmount());
  });

  it("image prioritaire (effet inactif) ou vignette de moins de 80 px : jamais d'étape", async () => {
    for (const cas of [{ actif: false, largeur: 400 }, { actif: true, largeur: 60 }]) {
      restaurer = installerDom({ largeur: cas.largeur });
      const { conteneur, racine } = await monter(
        createElement(Image, {
          actif: cas.actif,
          estChargee: () => false,
          charger: () => new Promise(() => {}),
        }),
      );
      await act(async () => {
        entrerDansEcran();
        await dormir(260);
      });
      expect(etape(conteneur)).toBe("");
      await act(async () => racine.unmount());
      restaurer();
    }
  });

  it("source changée pendant l'attente : le placeholder s'efface", async () => {
    restaurer = installerDom();
    const props = { estChargee: () => false, charger: () => new Promise(() => {}) };
    const { conteneur, racine } = await monter(createElement(Image, props));
    await act(async () => {
      entrerDansEcran();
      await dormir(260);
    });
    expect(etape(conteneur)).toContain("w=32");
    await act(async () =>
      racine.render(createElement(Image, { ...props, src: "/work/autre.jpg" })),
    );
    expect(etape(conteneur)).toBe("");
    await act(async () => racine.unmount());
  });
});

describe("useAfficheDepixelisee", () => {
  let restaurer = () => {};
  afterEach(() => restaurer());

  it("affiche qui n'est pas en cache : l'attente pixelisée, au format de la vidéo", async () => {
    restaurer = installerDom();
    const { conteneur, racine } = await monter(createElement(Affiche));
    await act(async () => {
      entrerDansEcran();
      await dormir(260);
    });
    const video = conteneur.firstElementChild;
    expect(video.getAttribute("data-fond")).toContain("w=32");
    expect(video.getAttribute("data-taille")).toBe("contain");
    await act(async () => racine.unmount());
  });

  it("affiche déjà en cache : rien de pixelisé", async () => {
    restaurer = installerDom();
    Object.defineProperty(window.HTMLImageElement.prototype, "complete", { get: () => true });
    Object.defineProperty(window.HTMLImageElement.prototype, "naturalWidth", { get: () => 1080 });
    const { conteneur, racine } = await monter(createElement(Affiche));
    await act(async () => {
      entrerDansEcran();
      await dormir(260);
    });
    expect(conteneur.firstElementChild.getAttribute("data-fond")).toBe("");
    await act(async () => racine.unmount());
  });
});
