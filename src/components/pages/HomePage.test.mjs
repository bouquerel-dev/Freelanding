import { describe, expect, it } from "bun:test";

import { SchemaSection } from "@/components/sections/SchemaSection";
import { schemaAccueil } from "@/content/schema";
import { homeContent } from "@/content/home";
import { HomePage } from "./HomePage";

/**
 * Composant SERVEUR asynchrone : l'appeler directement construit l'arbre de la
 * page sans exécuter ses sections. Depuis le 2026-11-24, le schéma « Ce que je
 * construis » suit le héros, à la place de la section noire du logiciel.
 */
function sectionsRendues(arbre) {
  const racine = Array.isArray(arbre.props.children) ? arbre.props.children : [arbre.props.children];
  const main = racine.find((enfant) => enfant?.type === "main");
  return main.props.children.map((fragment) => ({
    cle: fragment.key,
    element: fragment.props.children,
  }));
}

describe("HomePage, schéma sous le héros", () => {
  it("rend les sections dans l'ordre du contenu, le schéma juste après le héros", async () => {
    const sections = sectionsRendues(await HomePage());
    const cles = sections.map((section) => section.cle);
    expect(cles).toEqual(homeContent.sectionOrder);
    expect(cles.indexOf("schema")).toBe(cles.indexOf("hero") + 1);
    expect(cles).not.toContain("logiciel");
    const { element } = sections.find((section) => section.cle === "schema");
    expect(element.type).toBe(SchemaSection);
    expect(element.props.schema).toBe(schemaAccueil);
  });
});
