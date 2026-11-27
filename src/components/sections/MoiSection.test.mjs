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
 * « Moi, c'est Eliott » en schéma (2026-11-27) : une phrase, deux repères, la
 * frise des postes tirée de `/a-propos`, du plus ancien au plus récent.
 */
const html = await rendre(createElement(MoiSection, { about: homeContent.about }));

describe("MoiSection", () => {
  const experience = aboutContent.parcours.groupes.find((g) => g.titre === "Expérience").etapes;

  it("pose la frise dans l'ordre chronologique, l'année seule au-dessus de chaque poste", () => {
    const positions = [...experience].reverse().map((e) => html.indexOf(`>${e.structure}</span>`));
    for (const p of positions) expect(p).toBeGreaterThan(-1);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(html).toContain(">2023</span>");
    expect(html).toContain(">2026</span>");
  });

  it("écrit la nature de chaque poste : aucun employeur ne passe pour un client", () => {
    for (const e of experience) expect(html).toContain(`>${e.nature}</span>`);
  });

  it("relie l'étude de cas Würth et le parcours détaillé", () => {
    expect(html).toContain('href="/realisations/wurth-creation-de-compte"');
    expect(html).toContain(`href="${homeContent.about.cta.href}"`);
  });

  it("garde l'encadré qui se pose au défilement et la zone analytics « about »", () => {
    expect(html).toContain('data-section="about"');
    expect(html).toContain("about-cadre");
  });

  it("tient sans photo, sans repères, sans étiquette ni lien", async () => {
    const nu = await rendre(createElement(MoiSection, { about: { title: "Moi", body: ["Une phrase."] } }));
    expect(nu).toContain(">Moi</span>");
    expect(nu).not.toContain("<img");
    expect(nu).not.toContain("rounded-full px-[12px]");
    expect(nu).not.toContain("↗");
  });
});

describe("accueil", () => {
  it("rend les sections dans l'ordre, sans « trois façons » ni « Regardez ce que je construis »", async () => {
    const html = await rendre(await HomePage());
    const ordre = [...html.matchAll(/data-section="([a-z]+)"/g)].map((m) => m[1]);
    expect(ordre.indexOf("about")).toBeLessThan(ordre.indexOf("works"));
    expect(ordre).not.toContain("moyens");
    expect(ordre).not.toContain("showreel");
  });
});
