import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { rendezVousContent } from "@/content/rendez-vous";
import { ReservationAvecSujet } from "./ReservationAvecSujet";

/**
 * LA DÉMONSTRATION ET LE POINT D'ÉTAPE NE S'OUVRENT QUE PAR LEUR LIEN. `?sujet` est lu par
 * `useSearchParams`, servi ici par le contexte que Next pose lui-même.
 */
const C = rendezVousContent;
const nom = (id) => C.types.find((type) => type.id === id).nom;

function rendre(recherche, client = false) {
  return renderToStaticMarkup(
    createElement(
      SearchParamsContext.Provider,
      { value: new URLSearchParams(recherche) },
      createElement(ReservationAvecSujet, { types: C.types, emailContact: "contact@exemple.fr", client }),
    ),
  );
}

/*
 * DEPUIS LE 2026-11-24, UN PREMIER RENDEZ-VOUS N'A PLUS DE BOUTONS DE SUJET :
 * le visiteur écrit son sujet à la deuxième étape. `?sujet=` choisit seulement
 * le type envoyé au cockpit, sans rien afficher.
 */
const BOUTON_SUJET = /type="radio"/u;

describe("ReservationAvecSujet : sujets selon `?sujet`", () => {
  it("sans sujet, aucun bouton de sujet : les créneaux d'abord, aucun sujet privé", () => {
    const html = rendre("");
    expect(html).not.toMatch(BOUTON_SUJET);
    expect(html).toContain(C.etapes.titres[0]);
    expect(html).not.toContain(nom("demonstration"));
    expect(html).not.toContain(nom("point-d-etape"));
  });

  it("`?sujet=demonstration` l'ouvre et le nomme, seul sujet", () => {
    const html = rendre("sujet=demonstration");
    expect(html).toContain(nom("demonstration"));
    expect(html).not.toMatch(BOUTON_SUJET);
    expect(html).not.toContain(nom("point-d-etape"));
  });

  it("`?sujet=point-d-etape` l'ouvre et le nomme, seul sujet", () => {
    const html = rendre("sujet=point-d-etape");
    expect(html).toContain(nom("point-d-etape"));
    expect(html).not.toContain(nom("demonstration"));
  });

  it("un sujet public, ancien ou inconnu ne montre ni bouton ni sujet privé", () => {
    for (const sujet of ["site", "ia", "logiciel", "outil", "cto", "autre", "nimporte-quoi"]) {
      const html = rendre(`sujet=${sujet}`);
      expect(html, sujet).not.toMatch(BOUTON_SUJET);
      expect(html, sujet).not.toContain(nom("demonstration"));
      expect(html, sujet).not.toContain(nom("point-d-etape"));
    }
  });
});

describe("ReservationAvecSujet : la page client", () => {
  it("propose les quatre sujets de clients, sans ceux du premier rendez-vous", () => {
    const html = rendre("", true);
    for (const id of ["point-rapide", "demonstration", "proposition", "point-d-etape"]) {
      expect(html).toContain(nom(id));
    }
    for (const id of ["logiciel", "site", "ia", "decouverte"]) expect(html).not.toContain(`>${nom(id)}<`);
    expect(html).toMatch(BOUTON_SUJET);
  });

  it("`?sujet=proposition` présélectionne le bouton, un sujet de prospect est ignoré", () => {
    expect(rendre("sujet=proposition", true)).toMatch(/value="proposition"[^>]*checked|checked[^>]*value="proposition"/u);
    expect(rendre("sujet=logiciel", true)).not.toMatch(/checked/u);
  });
});
