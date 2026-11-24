import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { schemaAccueil } from "@/content/schema";
import { SchemaSection } from "./SchemaSection";

/*
 * « Ce que je construis », raccordé au héros le 2026-11-24 : même colonne,
 * même grain, fil qui descend du héros. Ces tests gardent le raccord, pas le
 * détail du dessin.
 */
const html = renderToStaticMarkup(createElement(SchemaSection, { schema: schemaAccueil }));

describe("SchemaSection", () => {
  it("se cale sur la colonne du héros : 1440 de large, marges de 20 puis 30 px", () => {
    expect(html).toContain("mx-auto max-w-[1440px] px-[20px] tablet:px-[30px]");
    expect(html).not.toContain("max-w-[1200px]");
  });

  it("prolonge le fil du héros jusqu'au sur-titre, sur ordinateur seulement", () => {
    expect(html).toMatch(/fil-suite fil-suite-fin[^"]*left-\[30px\][^"]*hidden[^"]*desktop:block/u);
    expect(html).toContain("desktop:before:w-[28px]");
  });

  it("partage le grain du héros sur ordinateur, sans toucher au téléphone", () => {
    expect(html).toContain("z-0 hidden desktop:block");
  });

  it("garde les trois onglets et le premier ouvert", () => {
    const onglets = html.match(/role="tab"/gu) ?? [];
    expect(onglets).toHaveLength(schemaAccueil.modes.length);
    expect(html).toContain('aria-selected="true"');
    for (const m of schemaAccueil.modes) expect(html).toContain(m.onglet);
  });

  it("met chaque carte dans la cascade d'entrée, avec un décalage croissant", () => {
    const delais = [...html.matchAll(/--d:(\d+)ms/gu)].map((m) => Number(m[1]));
    expect(delais[0]).toBe(0);
    const noeuds = delais.slice(3);
    expect(noeuds.length).toBeGreaterThan(0);
    expect(html.match(/schema-entree/gu)?.length ?? 0).toBeGreaterThanOrEqual(3 + schemaAccueil.modes[0].entrees.length);
  });

  it("n'a plus de viseur ni de trame de points dans le cadre : un fond calme à la place", () => {
    expect(html).not.toContain("hero-viseur");
    expect(html).not.toContain("radial-gradient");
    expect(html).not.toContain("background-size:22px");
    expect(html).toMatch(/schema-cadre[^"]*rounded-panel/u);
  });
});

/*
 * Squircles (2026-11-24) : une seule règle globale, sous `@supports`, qui
 * laisse les ronds et les pilules en arc de cercle.
 */
describe("squircles du site", () => {
  const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
  const bloc = css.slice(css.indexOf("@supports (corner-shape: squircle)"));

  it("n'arrive que chez les navigateurs qui savent les dessiner", () => {
    expect(bloc.length).toBeGreaterThan(0);
    expect(css).toContain("@supports (corner-shape: squircle)");
    expect(bloc).toMatch(/\[class\*="rounded"\][^{]*\{\s*corner-shape: squircle;/u);
  });

  it("garde les ronds, pilules et pastilles en arc de cercle", () => {
    expect(bloc).toMatch(/\.rounded-full, \.rounded-pill, \[class\*="rounded-\[50px\]"\]\) \{\s*corner-shape: round;/u);
  });

  it("donne au cadre du schéma un fond sans trame", () => {
    const cadre = css.slice(css.indexOf(".schema-cadre {"));
    expect(cadre).toContain("radial-gradient(ellipse");
    expect(cadre.slice(0, cadre.indexOf("}"))).not.toContain("background-size");
  });
});
