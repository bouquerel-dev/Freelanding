import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BoutonAppel } from "./BoutonAppel";

const rendre = (props) =>
  renderToStaticMarkup(createElement(BoutonAppel, { href: "/rdv?sujet=logiciel", label: "Réserver un appel", ...props }));

describe("BoutonAppel", () => {
  it("par défaut : volt, compact, à la largeur du contenu, avec la flèche dans sa pastille", () => {
    const html = rendre({});
    expect(html).toContain('href="/rdv?sujet=logiciel"');
    expect(html).toContain('data-part="bouton-appel"');
    expect(html).toContain('data-ton="volt"');
    expect(html).toContain("bouton-appel ");
    expect(html).toContain("w-fit");
    expect(html).toContain("h-[36px]");
    expect(html).toMatch(/ bg-accent"/);
    expect(html).toMatch(/rounded-tag [^"]*bg-accent-ink text-accent"/);
    expect(html).toContain("bouton-appel-fleche");
  });

  it("le libellé est lu une fois : la copie de permutation est masquée", () => {
    const html = rendre({});
    expect(html.split("Réserver un appel").length - 1).toBe(2);
    expect(html).toContain('aria-hidden="true"');
  });

  it("grand, encre et pleine largeur sur mobile", () => {
    const html = rendre({ taille: "grand", ton: "encre", largeur: "pleine-mobile" });
    expect(html).toContain("h-[48px]");
    expect(html).toContain("size-[36px]");
    expect(html).toContain('data-ton="encre"');
    expect(html).toContain("bg-background");
    expect(html).toMatch(/rounded-tag [^"]*bg-accent text-accent-ink"/);
    expect(html).toContain("w-full tablet:w-fit");
  });

  it("pleine largeur et forme courte sous 390 px", () => {
    const html = rendre({ largeur: "pleine", shortLabel: "Réserver" });
    expect(html).toContain("w-full ");
    expect(html).toContain("min-[390px]:hidden");
  });

  it("transmet les attributs du lien (nom accessible, tabulation)", () => {
    const html = rendre({ "aria-label": "Réserver un appel : Logiciel", tabIndex: -1 });
    expect(html).toContain('aria-label="Réserver un appel : Logiciel"');
    expect(html).toContain('tabindex="-1"');
  });
});
