import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { HomePage } from "@/components/pages/HomePage";
import { MoiSection } from "@/components/sections/MoiSection";
import { bornes, moisEnAnnee, placer, positionAujourdhui } from "@/components/sections/moi/frise";
import { aboutContent } from "@/content/about";
import { homeContent } from "@/content/home";

async function rendre(element) {
  const flux = await renderToReadableStream(element);
  await flux.allReady;
  return new Response(flux).text();
}

/*
 * « Moi, c'est Eliott » (2026-11-27, seconde passe) : fond noir, pas de photo,
 * formation et expérience sur un même axe des années.
 */
const maintenant = new Date(2026, 10, 27);
const html = await rendre(createElement(MoiSection, { about: homeContent.about, maintenant }));
const groupes = aboutContent.parcours.groupes;

describe("MoiSection", () => {
  it("montre la formation et l'expérience, chaque étape avec sa nature", () => {
    for (const g of groupes) {
      for (const e of g.etapes) {
        expect(html).toContain(`>${e.structure}</span>`);
        expect(html).toContain(`>${e.nature}</span>`);
      }
    }
    expect(html).toContain(`>${homeContent.about.lignes.formation}</span>`);
    expect(html).toContain(`>${homeContent.about.lignes.experience}</span>`);
  });

  it("n'affiche plus de photo : le visage est déjà dans le héros", () => {
    expect(html).not.toContain("<img");
    expect(homeContent.about.image).toBeUndefined();
  });

  it("pose une année par colonne, de la première étape à l'année en cours", () => {
    for (const an of [2021, 2022, 2023, 2024, 2025, 2026]) expect(html).toContain(`>${an}</span>`);
    expect(html).not.toContain(">2027</span>");
  });

  it("marque l'étape en cours, et relie l'étude de cas Würth et le parcours détaillé", () => {
    expect(html).toContain(`>${homeContent.about.lignes.enCours}</span>`);
    expect(html).toContain('href="/realisations/wurth-creation-de-compte"');
    expect(html).toContain(`href="${homeContent.about.cta.href}"`);
  });

  it("garde la zone analytics « about »", () => {
    expect(html).toContain('data-section="about"');
  });

  it("tient sans parcours, sans repères, sans sur-titre ni lien", async () => {
    const nu = await rendre(createElement(MoiSection, { about: { title: "Moi", body: ["Une phrase."] }, parcours: null }));
    expect(nu).toContain(">Moi</h2>");
    expect(nu).not.toContain("frise-piste");
    expect(nu).not.toContain("text-accent desktop:flex");
  });

  it("tient sur une étape sans résumé ni lien, avec la date du jour par défaut", async () => {
    const parcours = {
      groupes: [{ titre: "Expérience", etapes: [{ periode: "2025", structure: "Atelier", role: "Dev", nature: "Stage", debut: "2025-01", fin: "2025-03" }] }],
    };
    const rendu = await rendre(createElement(MoiSection, { about: { title: "Moi", body: ["Une phrase."] }, parcours }));
    expect(rendu).toContain(">Atelier</span>");
    expect(rendu).toContain("frise-piste");
  });
});

describe("géométrie de la frise", () => {
  it("lit un mois, refuse le reste", () => {
    expect(moisEnAnnee("2024-09")).toBeCloseTo(2024 + 8 / 12);
    expect(moisEnAnnee("2024")).toBeNull();
    expect(moisEnAnnee(undefined)).toBeNull();
  });

  it("borne l'axe de la première année à l'année qui suit aujourd'hui", () => {
    expect(bornes([{ debut: "2021-09" }, { debut: "nope" }], 2026.8)).toEqual({ de: 2021, a: 2027 });
    expect(bornes([], 2026.8)).toEqual({ de: 2026, a: 2027 });
  });

  it("décale d'un rang deux cartes trop proches, ignore une étape sans date", () => {
    const { etapes } = placer(
      [
        {
          ligne: "experience",
          etapes: [
            { structure: "B", debut: "2024-09" },
            { structure: "A", debut: "2024-03", fin: "2024-06" },
            { structure: "C", debut: "2026-07" },
            { structure: "X" },
          ],
        },
      ],
      2026.9,
    );
    expect(etapes.map((e) => [e.etape.structure, e.rang])).toEqual([["A", 0], ["B", 1], ["C", 0]]);
    expect(etapes.at(-1).enCours).toBe(true);
    expect(etapes.at(-1).fin).toBe(1);
  });

  it("place aujourd'hui sur la piste", () => {
    expect(positionAujourdhui(2021, 2027, 2024)).toBe(0.5);
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
