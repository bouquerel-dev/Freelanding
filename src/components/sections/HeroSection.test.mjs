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

  it("pose le portrait couleur dans une toile, jamais candidate au LCP", () => {
    expect(html).toContain('data-part="hero-photo"');
    expect(html).not.toMatch(/<img[^>]*portrait-couleur/u);
  });

  it("accroche six traits au visage, trois vers le titre, trois vers le bord, à toutes les tailles", () => {
    const reperes = html.match(/data-part="hero-repere" data-cote="(gauche|droite)"/gu) ?? [];
    expect(reperes).toHaveLength(6);
    expect(reperes.filter((r) => r.includes("gauche"))).toHaveLength(3);
    for (const trait of homeContent.hero.faceNotes ?? []) {
      expect(html).toContain(`>${trait.titre}</span>`);
      expect(html).toContain(`>${trait.detail}</span>`);
    }
    // Plus de « hidden desktop:flex » : les étiquettes s'affichent aussi au téléphone.
    expect(html).not.toMatch(/data-part="hero-repere"[^>]*hidden/u);
    // Deux jeux de traits : biais au téléphone, horizontal sur ordinateur.
    expect(html).toContain('class="hero-traits absolute inset-0 h-full w-full overflow-visible desktop:hidden"');
    expect(html).toContain("hidden desktop:block");
    // Sur ordinateur, l'œil : colonne gauche à 30,2 %, point à 44,4 % et 40,6 %, trait horizontal.
    expect(html).toContain('x1="30.2%" y1="40.6%" x2="44.4%" y2="40.6%"');
    // Au téléphone, l'épaule : le trait part sous l'étiquette (60 % + 4,5) et descend au point.
    expect(html).toContain('x1="68%" y1="64.5%" x2="74.4%" y2="67.9%"');
  });

  it("tient chaque petite description sur une ligne : vingt signes au plus", () => {
    for (const trait of homeContent.hero.faceNotes ?? []) expect(trait.detail.length).toBeLessThanOrEqual(23);
  });

  it("pose la trame et la photo dans le même carré, et précharge la trame", () => {
    const scene = html.slice(html.indexOf("data-scene"), html.indexOf("hero-traits"));
    expect(scene).toContain('data-part="hero-photo"');
    expect(scene).toContain('data-part="hero-visage"');
    expect(html).toMatch(/<div aria-hidden="true" data-scene="true" class="hero-scene[^"]*h-\[var\(--s\)\][^"]*w-\[var\(--s\)\]/u);
    expect(html).toContain('<link rel="preload" href="/images/eliott-portrait-trame.webp" as="image" type="image/webp"/>');
  });

  it("habille les deux boutons avec le bouton partagé de l'en-tête, logo compris", () => {
    const cta = html.match(/<a[^>]*data-part="hero-cta"[^>]*>/u)?.[0] ?? "";
    const secondaire = html.match(/<a[^>]*data-part="hero-cta-secondaire"[^>]*>/u)?.[0] ?? "";
    expect(cta).toContain("bouton-appel");
    expect(cta).toContain('data-ton="volt"');
    expect(secondaire).toContain('data-ton="encre"');
    expect(html.match(/bouton-appel-fleche/gu)).toHaveLength(2);
  });

  it("dit le titre en une phrase blanche, coupée en deux lignes", () => {
    const h1 = html.slice(html.indexOf("<h1"), html.indexOf("</h1>"));
    expect(h1).toContain("J’ai tout à prouver,");
    expect(h1).toContain("confiez-moi votre projet.");
    expect(h1).toContain("<br");
    expect(h1).not.toContain("text-accent");
  });

  it("coupe le titre après « prouver, » à toutes les tailles, téléphone compris", () => {
    const h1 = html.slice(html.indexOf("<h1"), html.indexOf("</h1>"));
    expect(h1).toContain("prouver, <br/>confiez");
    expect(h1).not.toContain("hidden tablet:inline");
    // Sur téléphone, la taille suit la largeur utile pour tenir la seconde ligne.
    expect(h1).toContain("calc((100vw/var(--zoom-ecran,1)_-_40px)/10.9)");
  });

  it("pose le fond de fils sous le texte, à toutes les tailles, en décor", () => {
    const balise = html.match(/<div[^>]*data-part="hero-ambiance"[^>]*>/u)?.[0] ?? "";
    expect(balise).toContain('aria-hidden="true"');
    expect(balise).toContain("pointer-events-none");
    expect(balise).not.toMatch(/class="(?:[^"]* )?hidden[ "]/u);
    expect(html).toContain("amb-fils");
    expect(html).toContain("amb-halo");
    // Le champ de points (« très IA ») et sa ronde sont retirés.
    for (const couche of ["amb-champ", "amb-ronde", "amb-lampe", "hero-balayage"]) expect(html).not.toContain(couche);
  });

  it("amorce le fil vers la section suivante sur la colonne du texte", () => {
    expect(html).toMatch(/fil-suite fil-suite-debut[^"]*left-\[30px\][^"]*hidden[^"]*desktop:block/u);
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
