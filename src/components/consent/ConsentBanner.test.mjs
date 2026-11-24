import "@/components/analytics/cle-posthog-de-test.mjs";
import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ConsentBanner } from "./ConsentBanner";
import { ConsentProvider } from "./ConsentProvider";

/*
 * Rendu serveur de la bannière (2026-11-24, « fixe en bas de l'écran
 * sur mobile et en bas à droite sur desktop ») : elle est dans le HTML, entre
 * par l'animation CSS, colle au bas sur téléphone et se cale dans le coin bas
 * droit au-delà.
 */
const html = renderToStaticMarkup(createElement(ConsentProvider, null, createElement(ConsentBanner)));

describe("ConsentBanner, rendu serveur", () => {
  it("est rendue en attente, avec son entrée CSS", () => {
    expect(html).toContain("data-consent-attente");
    expect(html).toMatch(/class="[^"]* consent-entree"/u);
  });

  it("colle au bas sur téléphone, coin bas droit au-delà, compacte", () => {
    expect(html).toContain("bottom-[max(12px,env(safe-area-inset-bottom))]");
    expect(html).not.toContain("bottom-[88px]");
    expect(html).toContain("justify-end");
    // La classe d'ordinateur est séparée de l'expression qui suit : collée,
    // Tailwind ne la générait pas.
    expect(html).toContain("desktop:inset-x-[16px] desktop:bottom-[16px] consent-entree");
    expect(html).toContain("tablet:max-w-[360px]");
    expect(html).not.toContain("desktop:max-w-[min(520px");
  });
});
