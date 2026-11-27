import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { HomePage } from "@/components/pages/HomePage";
import { MoiSection } from "@/components/sections/MoiSection";
import { aboutContent } from "@/content/about";
import { homeContent } from "@/content/home";

async function rendre(element) {
  const flux = await renderToReadableStream(element);
  await flux.allReady;
  return new Response(flux).text();
}

/*
 * « Moi, c'est Eliott » (2026-11-27, quatrième passe) : plus de frise
 * horizontale. Trois colonnes, avant le lycée, formation, expérience, chacune
 * un rail vertical ; seules les périodes portent des années.
 */
const html = await rendre(createElement(MoiSection, { about: homeContent.about }));
const groupes = aboutContent.parcours.groupes;
const { about } = homeContent;

describe("MoiSection", () => {
  it("montre la formation et l'expérience, chaque étape avec sa nature, son récit et sa leçon", () => {
    for (const g of groupes) {
      for (const e of g.etapes) {
        expect(html).toContain(`>${e.structure}</span>`);
        expect(html).toContain(`>${e.nature}</span>`);
        if (e.recit) expect(html).toContain(`>${e.recit}</p>`);
        if (e.retenu) expect(html).toContain(e.retenu);
      }
    }
    expect(html).toContain(`>${about.lignes.formation}</p>`);
    expect(html).toContain(`>${about.lignes.experience}</p>`);
    expect(html).toContain(`>${about.lignes.retenu}</span>`);
  });

  it("range chaque colonne du plus ancien au plus récent", () => {
    expect(html.indexOf("Lycée Arcisse de Caumont")).toBeLessThan(html.indexOf("IUT de Saint-Lô"));
    expect(html.indexOf("IUT de Saint-Lô")).toBeLessThan(html.indexOf("MyDigitalSchool"));
    expect(html.indexOf("Mediapilote")).toBeLessThan(html.indexOf("MECA SERVICES"));
    expect(html.indexOf("MECA SERVICES")).toBeLessThan(html.indexOf(">Indépendant<"));
  });

  it("n'a plus de frise horizontale ni de colonne d'années vide", () => {
    expect(html).not.toContain("frise-piste");
    expect(html).not.toContain("sticky");
    for (const an of ["2018", "2020"]) expect(html).not.toContain(`>${an}</span>`);
  });

  it("raconte avant le lycée, met en avant l'optimisation, sans jeux vidéo ni Pong", () => {
    const { prologue } = about;
    expect(html).toContain(`>${prologue.titre}</p>`);
    for (const item of prologue.items) expect(html).toContain(`>${item.texte}</span>`);
    expect(html).toContain('text-accent">Optimiser</span>');
    expect(html).toContain(`>${prologue.fil}</p>`);
    for (const absent of ["Minecraft", "Pokémon", "Pong", "Scratch"]) expect(html).not.toContain(absent);
    expect(html).toContain("Lorient");
  });

  it("détaille le parcours du robot de terminale", () => {
    const lycee = groupes.find((g) => g.titre === "Formation").etapes.find((e) => e.nature === "Bac STI2D");
    for (const mot of ["Arduino", "ligne noire", "canette", "phares", "pont"]) expect(lycee.recit).toContain(mot);
  });

  it("marque l'étape en cours, relie l'étude de cas Würth et le parcours détaillé", () => {
    expect(html).toContain(`>${about.lignes.enCours}</span>`);
    expect(html).toContain("frise-pouls bg-accent");
    expect(html).toContain('href="/realisations/wurth-creation-de-compte"');
    expect(html).toContain(`href="${about.cta.href}"`);
  });

  it("ne dessine aucune pilule", () => {
    expect(html).not.toMatch(/rounded-full/u);
    expect(html).toContain("rounded-tag border border-white/15");
  });

  it("garde la zone analytics « about »", () => {
    expect(html).toContain('data-section="about"');
  });

  it("tient sans parcours, sans prologue, sans repères, sans sur-titre ni lien", async () => {
    const nu = await rendre(createElement(MoiSection, { about: { title: "Moi", body: ["Une phrase."] }, parcours: null }));
    expect(nu).toContain(">Moi</h2>");
    expect(nu).not.toContain("<ol");
    expect(nu).not.toContain("font-mono text-[12px] uppercase text-accent");
  });

  it("tient sur une étape sans résumé, sans date ni lien, avec ou sans résumé court", async () => {
    const parcours = {
      groupes: [
        {
          titre: "Expérience",
          etapes: [
            { periode: "2025", structure: "Atelier", role: "Dev", nature: "Stage" },
            { periode: "2024", structure: "Bureau", role: "Dev", nature: "Stage", court: "Trois mots", debut: "2024-01", fin: "2024-03" },
          ],
        },
      ],
    };
    const rendu = await rendre(createElement(MoiSection, { about: { title: "Moi", body: ["Une phrase."] }, parcours }));
    expect(rendu).toContain(">Atelier</span>");
    expect(rendu).toContain(">Trois mots</p>");
    // Sans date, une étape n'est pas « en cours ».
    expect(rendu).not.toContain("bg-accent text-accent-ink");
  });
});

describe("accueil", () => {
  it("rend les sections dans l'ordre, sans « trois façons » ni « Regardez ce que je construis »", async () => {
    const rendu = await rendre(await HomePage());
    const ordre = [...rendu.matchAll(/data-section="([a-z]+)"/g)].map((m) => m[1]);
    expect(ordre.indexOf("about")).toBeLessThan(ordre.indexOf("works"));
    expect(ordre).not.toContain("moyens");
    expect(ordre).not.toContain("showreel");
  });
});
