import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { homeContent } from "@/content/home";
import { siteConfig } from "@/content/site";
import { HomePage } from "@/components/pages/HomePage";
import { Footer } from "./Footer";

/**
 * Le pied de page condensé du 2026-11-27, rendu en HTML avec une configuration
 * modifiée le temps d'un test : chaque bloc disparaît proprement quand sa
 * donnée manque, et le titre retombe sur `heading` sans découpage.
 */
let sauvegarde;

beforeEach(() => {
  sauvegarde = {
    footerCta: siteConfig.footerCta,
    footerNav: siteConfig.footerNav,
    contact: { ...siteConfig.contact },
    faq: homeContent.faq,
    jeton: process.env.RDV_TOKEN,
  };
});

afterEach(() => {
  siteConfig.footerCta = sauvegarde.footerCta;
  siteConfig.footerNav = sauvegarde.footerNav;
  Object.assign(siteConfig.contact, sauvegarde.contact);
  homeContent.faq = sauvegarde.faq;
  if (sauvegarde.jeton === undefined) delete process.env.RDV_TOKEN;
  else process.env.RDV_TOKEN = sauvegarde.jeton;
});

const rendre = async (props) => renderToStaticMarkup(await Footer(props));

describe("Footer condensé", () => {
  it("rend le titre en lignes, le numéro, l'adresse, la zone et le bouton créneau", async () => {
    const html = await rendre();
    expect(html).toContain("Parlons de");
    expect(html).toContain(`href="tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}"`);
    expect(html).toContain('href="#rendez-vous"');
    expect(html).toContain(siteConfig.contact.address);
  });

  it("sans données facultatives, chaque bloc s'efface", async () => {
    siteConfig.footerCta = { heading: "Titre d’un bloc" };
    siteConfig.contact.phone = "";
    siteConfig.contact.address = "";
    siteConfig.contact.responseTime = "";
    siteConfig.footerNav = [{ label: "Ailleurs", href: "https://exemple.fr", external: true }];
    const html = await rendre();
    expect(html).toContain("Titre d’un bloc");
    expect(html).not.toContain('href="tel:');
    const lien = html.match(/<a[^>]*href="https:\/\/exemple\.fr"[^>]*>/)?.[0] ?? "";
    expect(lien).toContain('target="_blank"');
    expect(lien).toContain('rel="noopener noreferrer"');
  });

  it("sans appel à l'action, pas de titre ni de phrase", async () => {
    siteConfig.footerCta = undefined;
    const html = await rendre();
    expect(html).toContain("<h2");
    expect(html).not.toContain("Parlons de");
  });

  it("un sujet inconnu des types configurés ne présélectionne rien", async () => {
    process.env.RDV_TOKEN = "jeton-de-test";
    const connu = await rendre({ sujetRendezVous: "logiciel" });
    const inconnu = await rendre({ sujetRendezVous: "inconnu" });
    expect(connu).toContain('href="#rendez-vous"');
    expect(inconnu).toContain('href="#rendez-vous"');
  });
});

describe("Accueil sans FAQ", () => {
  it("la FAQ se rend vide plutôt que de planter", async () => {
    homeContent.faq = undefined;
    const arbre = await HomePage();
    expect(arbre).toBeTruthy();
  });
});
