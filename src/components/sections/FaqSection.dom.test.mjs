import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { faqItems } from "@/content/faq";
import { FaqSection } from "./FaqSection";

/**
 * L'accordéon de la FAQ en deux parties, monté dans jsdom : la première
 * question est ouverte d'emblée, un clic ouvre une autre question sans fermer
 * la première, un second clic la referme.
 */
let restaurer;
let racine;

async function monter() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
  const w = dom.window;
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    self: globalThis.self,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    IntersectionObserver: globalThis.IntersectionObserver,
  };
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.self = w;
  globalThis.requestAnimationFrame = (rappel) => setTimeout(() => rappel(Date.now()), 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  restaurer = () => Object.assign(globalThis, precedent);
  const hote = w.document.createElement("div");
  w.document.body.appendChild(hote);
  racine = createRoot(hote);
  await act(async () => {
    racine.render(createElement(FaqSection, { faq: faqItems }));
  });
  return hote;
}

afterEach(async () => {
  await act(async () => racine?.unmount());
  racine = undefined;
  restaurer?.();
});

describe("FaqSection, accordéon", () => {
  it("ouvre et referme une question au clic, la première restant ouverte", async () => {
    const hote = await monter();
    const [premiere, seconde] = hote.querySelectorAll("button[aria-expanded]");
    expect(premiere.getAttribute("aria-expanded")).toBe("true");
    expect(seconde.getAttribute("aria-expanded")).toBe("false");
    await act(async () => seconde.click());
    expect(seconde.getAttribute("aria-expanded")).toBe("true");
    expect(premiere.getAttribute("aria-expanded")).toBe("true");
    await act(async () => seconde.click());
    expect(seconde.getAttribute("aria-expanded")).toBe("false");
  });
});
