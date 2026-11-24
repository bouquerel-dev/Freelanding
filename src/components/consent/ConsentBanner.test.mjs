import "@/components/analytics/cle-posthog-de-test.mjs";
import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ConsentBanner } from "./ConsentBanner";
import { ConsentProvider } from "./ConsentProvider";

/*
 * Rendu serveur de la bannière (2026-11-24, « en bas à gauche, plus
 * compacte ») : elle est dans le HTML, entre par l'animation CSS, et se cale
 * dans le coin bas gauche sur ordinateur.
 */
const html = renderToStaticMarkup(createElement(ConsentProvider, null, createElement(ConsentBanner)));

describe("ConsentBanner, rendu serveur", () => {
  it("est rendue en attente, avec son entrée CSS", () => {
    expect(html).toContain("data-consent-attente");
    expect(html).toMatch(/class="[^"]* consent-entree"/u);
  });

  it("se cale dans le coin bas gauche sur ordinateur, compacte", () => {
    // La classe d'ordinateur est séparée de l'expression qui suit : collée,
    // Tailwind ne la générait pas.
    expect(html).toContain("desktop:inset-x-[16px] desktop:bottom-[16px] consent-entree");
    expect(html).toContain("max-w-[360px]");
    expect(html).not.toContain("desktop:max-w-[min(520px");
  });
});
