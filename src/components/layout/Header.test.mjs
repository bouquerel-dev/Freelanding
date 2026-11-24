import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { siteConfig } from "@/content/site";
import { uiLabels } from "@/content/ui";
import { Header } from "./Header";

/*
 * En-tête épuré le 2026-11-24 (demande d'Eliott) : le logo seul à gauche, les
 * liens séparés par des barres obliques, et un bouton « Réserver un appel » à
 * pastille flèche.
 */
const html = renderToStaticMarkup(createElement(Header, { site: siteConfig }));

describe("Header", () => {
  it("n'affiche plus la baseline ni son séparateur", () => {
    expect(html).not.toContain("Sites, logiciels et IA");
    expect(html).not.toContain("w-px");
  });

  it("garde les barres obliques entre les liens", () => {
    const separateurs = html.split(`>${uiLabels.chrome.navSeparator}<`).length - 1;
    expect(separateurs).toBe(siteConfig.nav.length - 1);
  });

  it("porte le bouton de rendez-vous, au rayon des boutons du site, avec sa flèche", () => {
    const debut = html.indexOf('data-part="header-cta"');
    expect(debut).toBeGreaterThan(-1);
    const bouton = html.slice(debut, html.indexOf("</a>", debut));
    expect(bouton).toContain(siteConfig.primaryCta.label);
    expect(bouton).toContain("rounded-control");
    expect(bouton).toContain("<svg");
  });

  it("sans forme courte, le bouton porte le libellé entier partout", () => {
    const site = { ...siteConfig, primaryCta: { ...siteConfig.primaryCta, shortLabel: undefined } };
    const rendu = renderToStaticMarkup(createElement(Header, { site }));
    expect(rendu).toContain(siteConfig.primaryCta.label);
    expect(rendu).not.toContain("min-[390px]:hidden");
  });
});
