import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { homeContent } from "@/content/home";
import { faqItems } from "@/content/faq";
import { siteConfig } from "@/content/site";
import { ActualitesSection } from "./ActualitesSection";
import { FaqSection } from "./FaqSection";
import { StatsSection } from "./StatsSection";
import { WhyUsSection } from "./WhyUsSection";
import { EtiquetteDemi, TitreDemi } from "./demi/TitreDemi";

/**
 * Les sections en deux parties de l'accueil (2026-11-27). Ce que ces tests
 * gardent : chaque section rend son titre ligne par ligne, son fond s'ouvre
 * depuis la couleur de la section précédente quand on la donne, et les textes
 * viennent de la donnée.
 */
const rendre = (type, props) => renderToStaticMarkup(createElement(type, props));

const article = (n) => ({
  slug: `article-${n}`,
  title: `Titre ${n}`,
  date: "2026-11-2" + n,
  cover: { src: `/images/a${n}.jpg`, alt: "", width: 800, height: 600 },
});

describe("TitreDemi", () => {
  it("rend une ligne par entrée, dans un h2", () => {
    const html = rendre(TitreDemi, { lignes: ["Un", "Deux"], encre: "text-background" });
    expect(html.startsWith("<h2")).toBe(true);
    expect(html).toContain("Un");
    expect(html).toContain("Deux");
  });

  it("sans ligne, rend un titre vide sans planter", () => {
    expect(rendre(TitreDemi, { lignes: [], encre: "e" })).toContain("<h2");
  });

  it("l'étiquette garde l'encre demandée", () => {
    expect(rendre(EtiquetteDemi, { texte: "FAQ", encre: "text-accent-ink" })).toContain("text-accent-ink");
  });
});

describe("WhyUsSection", () => {
  it("rend la conviction, les arguments numérotés et le chiffre de propriété", () => {
    const html = rendre(WhyUsSection, { whyUs: homeContent.whyUs });
    for (const point of homeContent.whyUs.points) expect(html).toContain(point.titre);
    expect(html).toContain(">01</span>");
    expect(html).toContain(homeContent.whyUs.stats[0].label);
    expect(html).toContain('data-part="ouverture"');
  });

  it("un lien externe s'ouvre dans un nouvel onglet", () => {
    const whyUs = { ...homeContent.whyUs, ctas: [{ label: "Code", href: "https://github.com", external: true }] };
    const html = rendre(WhyUsSection, { whyUs });
    expect(html).toContain('href="https://github.com" target="_blank" rel="noopener noreferrer"');
  });

  it("lit un chiffre décimal et un titre sans lignes", () => {
    const stat = { value: "2.5x", suffix: "x", label: "Plus vite", format: "decimal" };
    const entier = { value: "7", label: "Sans décimale", format: "decimal" };
    const reste = { ...homeContent.whyUs, titleLines: undefined, eyebrow: undefined, intro: undefined };
    const html = rendre(WhyUsSection, { whyUs: { ...reste, title: "Titre seul", stats: [stat], ctas: undefined } });
    expect(html).toContain("Titre seul");
    expect(html).toContain("Plus vite");
    expect(rendre(WhyUsSection, { whyUs: { ...reste, stats: [entier] } })).toContain("Sans décimale");
    const unite = { value: "3", suffix: "h", label: "Unité à part" };
    expect(rendre(WhyUsSection, { whyUs: { ...reste, stats: [unite] } })).toContain("Unité à part");
    const sansTitre = rendre(WhyUsSection, { whyUs: { ...reste, title: undefined, stats: [] } });
    expect(sansTitre).not.toContain("Plus vite");
  });
});

describe("StatsSection", () => {
  it("avec une couleur d'avant, le volt s'ouvre depuis elle et le filet fixe disparaît", () => {
    const html = rendre(StatsSection, { numbers: homeContent.numbers, autour: "bg-papier" });
    expect(html).toContain('data-part="ouverture"');
    expect(html).toContain("bg-papier");
    expect(html).not.toContain("opacity-[0.18]");
  });

  it("sans elle, l'aplat est posé d'un bloc", () => {
    const html = rendre(StatsSection, { numbers: homeContent.numbers });
    expect(html).not.toContain('data-part="ouverture"');
    expect(html).toContain("opacity-[0.18]");
  });
});

describe("FaqSection", () => {
  it("sur l'accueil : fond papier ouvert depuis le volt, questions des trois offres", () => {
    const html = rendre(FaqSection, { faq: faqItems, fond: "bg-papier", autour: "bg-accent", topAccent: false });
    expect(html).toContain('data-part="ouverture"');
    expect(html).toContain("sites internet");
    expect(html).toContain("automatisations IA");
    expect(html).toContain(homeContent.faqSection.cta.label);
  });

  it("ailleurs : fond gris posé, languette et filet fixes, sans bouton si pas de lien", () => {
    const html = rendre(FaqSection, { faq: faqItems, cta: null, eyebrow: "" });
    expect(html).not.toContain('data-part="ouverture"');
    expect(html).toContain("bg-muted");
    expect(html).toContain("top-[-20px]");
    expect(html).not.toContain(homeContent.faqSection.cta.label);
    expect(rendre(FaqSection, { faq: faqItems, topAccent: false })).not.toContain("top-[-20px]");
  });
});

describe("ActualitesSection", () => {
  it("liste les quatre derniers articles avec vignette, date et lien", () => {
    const posts = [1, 2, 3, 4, 5].map(article);
    const html = rendre(ActualitesSection, { posts, articles: homeContent.articles, autour: "bg-papier" });
    expect(html.match(/href="\/blog\/article-/g)).toHaveLength(4);
    expect(html).not.toContain("article-5");
    expect(html).toContain('href="/blog"');
    expect(html).toContain(homeContent.articles.cta.label);
  });

  it("sans lignes ni lien, retombe sur le surtitre et n'ajoute pas de bouton", () => {
    const articles = { eyebrow: "Nouveautés", featuredSlugs: [] };
    const html = rendre(ActualitesSection, { posts: [article(1)], articles, autour: "bg-papier" });
    expect(html).toContain("Nouveautés");
    expect(html).not.toContain('href="/blog"');
    const vide = rendre(ActualitesSection, { posts: [], articles: { featuredSlugs: [] }, autour: "bg-papier" });
    expect(vide).toContain("<h2");
  });
});

describe("Pied de page, données", () => {
  it("« Accueil » a quitté la navigation, le titre a ses lignes", () => {
    expect(siteConfig.footerNav.map((l) => l.label)).not.toContain("Accueil");
    expect(siteConfig.footerCta.headingLines.join(" ")).toBe(siteConfig.footerCta.heading);
  });
});
