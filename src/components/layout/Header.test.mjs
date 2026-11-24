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
    const debut = html.indexOf('data-part="bouton-appel"');
    expect(debut).toBeGreaterThan(-1);
    const bouton = html.slice(debut, html.indexOf("</a>", debut));
    expect(bouton).toContain(siteConfig.primaryCta.label);
    expect(bouton).toContain("rounded-control");
    expect(bouton).toContain("<svg");
  });

  it("n'affiche plus le blog, qui reste au pied de page", () => {
    expect(siteConfig.nav.map((l) => l.href)).not.toContain("/blog");
    expect(siteConfig.menuNav.map((l) => l.href)).not.toContain("/blog");
    expect(siteConfig.footerNav.map((l) => l.href)).toContain("/blog");
    expect(html).not.toContain('href="/blog"');
  });

  it("chaque lien porte sa copie volt masquée aux lecteurs d'écran et son trait", () => {
    for (const lien of siteConfig.nav) {
      expect(html).toContain(`<span class="nav-lien-texte">${lien.label}</span>`);
      expect(html).toContain(`<span aria-hidden="true" class="nav-lien-copie">${lien.label}</span>`);
    }
    expect(html.split('class="nav-lien-trait"').length - 1).toBe(siteConfig.nav.length);
  });

  it("sans forme courte, le bouton porte le libellé entier partout", () => {
    const site = { ...siteConfig, primaryCta: { ...siteConfig.primaryCta, shortLabel: undefined } };
    const rendu = renderToStaticMarkup(createElement(Header, { site }));
    expect(rendu).toContain(siteConfig.primaryCta.label);
    expect(rendu).not.toContain("min-[390px]:hidden");
  });
});
