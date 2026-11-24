import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { homeContent } from "@/content/home";
import { uiLabels } from "@/content/ui";
import { HeroSection } from "./HeroSection";

/*
 * Héros refait le 2026-11-24 : une personne qui se présente, son avantage face
 * aux agences, puis comment. Ces tests gardent ce que la page doit dire, pas
 * la mise en forme.
 */
const html = renderToStaticMarkup(createElement(HeroSection, { hero: homeContent.hero }));

describe("HeroSection", () => {
  it("se présente avec le nom en clair", () => {
    expect(html).toContain("Bonjour, je suis");
    expect(html).toContain("Eliott Bouquerel");
  });

  it("garde un seul h1, ancré sur #services pour les fils d'Ariane", () => {
    expect(html.match(/<h1/gu) ?? []).toHaveLength(1);
    expect(html).toContain('id="services"');
    for (const ligne of homeContent.hero.titleLines ?? []) expect(html).toContain(ligne);
  });

  it("donne aux lecteurs d'écran toutes les prestations, pas l'animation", () => {
    for (const element of homeContent.hero.buildItems ?? []) expect(html).toContain(element);
  });

  it("garde le rendez-vous et les réalisations comme seules actions", () => {
    expect(html).toContain(uiLabels.services.rdvLabel);
    expect(html).toContain('href="/realisations"');
  });

  it("n'a plus de barre du bas ni de vidéo", () => {
    expect(html).not.toContain("<video");
    expect(html).not.toContain('data-part="comparaison"');
  });
});
