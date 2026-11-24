import { describe, expect, test } from "bun:test";
import { duree, homeContent } from "./home.ts";
import { siteConfig } from "./site.ts";
import { uiLabels } from "./ui.ts";
import { euros, repereAgenceLogiciel, SUR_DEVIS } from "./offre.ts";

/**
 * L'ACCUEIL, ce que la relecture d'écran ne garde pas.
 *
 * L'ordre des sections et le libellé du rendez-vous ont été décidés par un
 * panel design le 2026-09-24 (phase C). Ils se défont sans bruit : une section
 * déplacée ou un bouton renommé ne casse ni les types ni le rendu.
 */
describe("accueil", () => {
  const ordre = homeContent.sectionOrder;

  test("plus de logos sous le héros : la barre du bas est partie (2026-11-24)", () => {
    expect(ordre).not.toContain("logoBand");
    expect(ordre[0]).toBe("hero");
  });

  test("l'ordre : qui et quel avantage, ce que je construis, puis les preuves", () => {
    expect(ordre).toEqual([
      "hero",
      "schema",
      "moyens",
      "about",
      "showreel",
      "works",
      "whyUs",
      "numbers",
      "faq",
      "articles",
    ]);
    expect(new Set(ordre).size).toBe(ordre.length);
    // « works » se rend depuis `featuredWorkSlugs`, « schema » depuis `schema.ts`.
    for (const section of ordre.filter((nom) => nom !== "works" && nom !== "schema")) {
      expect(homeContent[section], `la section « ${section} » n'a pas de contenu`).toBeDefined();
    }
    expect(homeContent.featuredWorkSlugs.length).toBeGreaterThan(0);
  });

  test("l'accueil ne liste aucun métier : il parle à chacun sans le citer", () => {
    expect(ordre).not.toContain("metiers");
    expect(JSON.stringify(homeContent.hero)).not.toContain("/logiciel-metier/");
  });

  test("le chiffre Würth n'est plus dans le héros", () => {
    expect(homeContent.hero.proofs ?? []).toHaveLength(0);
    expect(JSON.stringify(homeContent.hero)).not.toContain("Würth");
  });

  test("le héros ne chiffre plus ce qu'une agence facture (2026-11-24)", () => {
    expect(homeContent.hero.comparison).toBeUndefined();
    expect(JSON.stringify(homeContent.hero)).not.toMatch(/\d\s?000/u);
  });

  test("la bande des logos ne porte aucun intitulé qui en ferait des clients", () => {
    expect(homeContent.logoBand?.title).toBeUndefined();
  });

  test("l'aplat vert des chiffres coupe les sections claires du bas de page", () => {
    // Décision d'Eliott du 2026-11-02 : « Pourquoi moi », la FAQ et les articles
    // sont clairs ; les chiffres, en aplat vert, s'intercalent.
    const chiffres = ordre.indexOf("numbers");
    expect(ordre[chiffres - 1]).toBe("whyUs");
    expect(ordre[chiffres + 1]).toBe("faq");
  });

  test("les offres ne sont pas redites sous le héros, chacune a sa section", () => {
    expect(ordre).not.toContain("services");
    expect(ordre.indexOf("showreel")).toBe(ordre.indexOf("about") + 1);
  });

  test("trois moyens rendent le temps, sans aucun nom de prospect", () => {
    const { moyens } = homeContent;
    expect(moyens.lignes.map((l) => l.lien.href)).toContain("/services/automatisation#referent");
    expect(moyens.lignes).toHaveLength(3);
    expect(moyens.lignes.at(-1).corps).toContain("ponctuelles");
    const { hero, logiciel, whyUs } = homeContent;
    expect(JSON.stringify({ hero, logiciel, moyens, whyUs })).not.toContain("/services/logiciel-metier");
    expect(JSON.stringify(moyens).toLowerCase()).not.toContain("sitpo");
  });

  test("la semaine rend exactement le gain annoncé", () => {
    const { jours } = homeContent.logiciel.demo;
    expect(jours.map((j) => j.main)).toEqual([150, 180, 90, 120, 120].map(duree));
    expect(jours.map((j) => j.rendu)).toEqual([120, 144, 72, 96, 96].map(duree));
  });


  test("la démonstration montre un gain dérivé de ses hypothèses, jamais écrit à la main", () => {
    const demo = homeContent.logiciel?.demo;
    expect(demo?.jours).toHaveLength(5);
    expect(Math.max(...demo.jours.map((j) => j.part))).toBe(1);
    expect(demo.compteur.main.valeur).toBe(duree(660));
    expect(demo.compteur.outil.valeur).toBe(duree(132));
    expect(demo.gain.valeur).toBe(duree(528));
    expect(demo.gain.detail).toContain("396 heures");
    expect(demo.note).toMatch(/exemple/iu);
  });

  test("une durée s'écrit en minutes, en heures, ou les deux", () => {
    expect(duree(36)).toBe("36\u00A0min");
    expect(duree(120)).toBe("2\u00A0h");
    expect(duree(132)).toBe("2\u00A0h\u00A012");
    expect(duree(65)).toBe("1\u00A0h\u00A005");
  });

  test("le titre est la phrase d'Eliott, en deux lignes, sans parler d'IA", () => {
    expect(homeContent.hero.doors ?? []).toHaveLength(0);
    expect(homeContent.hero.title).toBe("J’ai tout à prouver.");
    expect(homeContent.hero.title).not.toMatch(/IA/u);
    expect(homeContent.hero.titleLines?.join(" ")).toBe(homeContent.hero.title);
    expect(homeContent.about.title).not.toBe(homeContent.hero.title);
    expect(homeContent.about.titleLines?.join(" ")).toBe(homeContent.about.title);
  });

  test("le haut de page dit qui, quoi et comment : sites, logiciels et IA au même rang", () => {
    expect(homeContent.hero.eyebrow).toBe("Bonjour, je suis Eliott Bouquerel");
    expect(homeContent.hero.buildItems).toEqual(["des sites internet", "des logiciels métier", "des automatisations IA"]);
    // Pourquoi lui : le contraste avec l'agence, puis le résultat client.
    // Ni l'IA, ni « un seul interlocuteur », ni « prix corrects ».
    const sous = homeContent.hero.subtitle ?? "";
    expect(sous).toMatch(/Une agence a déjà sa réputation/u);
    expect(sous).toMatch(/clients/u);
    expect(sous).not.toMatch(/\bIA\b|agents/u);
    expect(sous.length).toBeLessThan(150);
    expect(homeContent.hero.faceNotes).toEqual(["Très réactif", "Tout à votre nom", "Utile avant beau"]);
    expect(JSON.stringify(homeContent.hero)).not.toMatch(/interlocuteur|prix correct/iu);
  });

  test("le héros dit ce qui explique le prix, sans montant", () => {
    const phrase = homeContent.hero.subtitleParagraphs?.[0]?.text ?? "";
    expect(phrase.toLowerCase()).not.toContain("prix ferme");
    expect(phrase).not.toMatch(/\d\s?000/u);
  });

  test("« jusqu'à deux fois moins cher » est parti avec le site vitrine", () => {
    // Seule la comparaison du site vitrine le rendait exact : le logiciel
    // s'approche du prix d'une agence sans le diviser par deux.
    const textes = [
      homeContent.hero.eyebrow,
      homeContent.seo.description,
      ...homeContent.about.body,
    ];
    for (const texte of textes) expect(texte ?? "").not.toMatch(/deux fois moins/iu);
  });

  test("« 1 projet à la fois » n'est dit qu'une fois, par la section chiffres", () => {
    const about = homeContent.about;
    const textes = [about.launchedLabel, about.projectsLabel, about.counter?.caption, ...about.body];
    for (const texte of textes) expect(texte ?? "").not.toMatch(/projet à la fois/u);
  });
});

describe("un seul libellé pour le rendez-vous", () => {
  const libelle = uiLabels.services.rdvLabel;

  test("l'en-tête, le bouton flottant et « Pourquoi moi » disent le même mot", () => {
    expect(siteConfig.primaryCta.label.toLowerCase()).toBe(libelle.toLowerCase());
    expect(siteConfig.floatingCta?.label).toBe(libelle);
    expect(homeContent.whyUs.ctas?.[0]?.label).toBe(libelle);
  });

  test("« Démarrer un projet » ne revient pas comme libellé d'action", () => {
    const libelles = [
      siteConfig.primaryCta.label,
      siteConfig.primaryCta.shortLabel ?? "",
      siteConfig.floatingCta?.label ?? "",
    ];
    for (const l of libelles) expect(l.toLowerCase()).not.toContain("démarrer");
  });
});

describe("la marche « Prestations » des fils d'Ariane", () => {
  test("mène à une section qui existe sur l'accueil", async () => {
    const { readFileSync } = await import("node:fs");
    const heros = readFileSync(new URL("../components/sections/HeroSection.tsx", import.meta.url), "utf8");
    // `/#services` : l'accordéon a quitté l'accueil, l'ancre vit sur les portes.
    expect(heros).toContain('id="services"');
    expect(homeContent.sectionOrder).toContain("hero");
  });
});
