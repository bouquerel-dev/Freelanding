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
  it("se présente avec le nom en clair, mis en accent", () => {
    expect(html).toContain("Bonjour, je suis");
    expect(html).toContain('<span class="text-accent">Eliott Bouquerel</span>');
  });

  it("pose le visage en trame à côté du titre, jamais dedans", () => {
    expect(html).toContain('data-part="hero-visage"');
    const h1 = html.slice(html.indexOf("<h1"), html.indexOf("</h1>"));
    expect(h1).not.toContain("<canvas");
  });

  it("pose les trois repères numérotés autour du visage", () => {
    const reperes = html.match(/data-part="hero-repere"/gu) ?? [];
    expect(reperes).toHaveLength(3);
    for (const [i, note] of (homeContent.hero.faceNotes ?? []).entries()) {
      expect(html).toContain(`>0${i + 1}</span>${note}`);
    }
  });

  it("borne la largeur du héros sur la colonne de 1440 du site", () => {
    expect(html).toContain("max-w-[1440px]");
  });

  it("n'a plus de bandeau qui défile", () => {
    expect(html).not.toContain("animate-marquee");
    expect(html).not.toContain('data-part="ruban"');
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

  it("tient sur un héros minimal : titre seul, sans visage, liste, sous-titre ni lien", () => {
    const nu = renderToStaticMarkup(createElement(HeroSection, { hero: { title: "Titre seul" } }));
    expect(nu).toContain("Titre seul");
    expect(nu).not.toContain('data-part="hero-visage"');
    expect(nu).not.toContain('data-part="hero-salut"');
    expect(nu).not.toContain('data-part="hero-pour-qui"');
    expect(nu).not.toContain('data-part="hero-cta-secondaire"');
  });

  it("garde la salutation entière quand le nom n'y figure pas", () => {
    const autre = renderToStaticMarkup(
      createElement(HeroSection, {
        hero: { title: "T", eyebrow: "Bonjour", person: { name: "Absent" }, buildItems: ["des sites"], subtitle: "Sous-titre seul" },
      }),
    );
    expect(autre).toContain(">Bonjour</p>");
    expect(autre).not.toContain("text-accent\">Absent");
    expect(autre).toContain("des sites");
    expect(autre).toContain("Sous-titre seul");
  });
});
