import { describe, expect, it } from "bun:test";
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
});
