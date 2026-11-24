import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import HubMetiers from "@/app/(site)/logiciel-metier/page";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { ServicePage } from "@/components/pages/services/ServicePage";
import { WorkRendezVous } from "@/components/pages/work/WorkRendezVous";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { WhyUsSection } from "@/components/sections/WhyUsSection";
import { prestations } from "@/content/offre";
import { content } from "@/lib/content";

/*
 * Chaque prise de rendez-vous du site passe par le bouton d'appel partagé
 * (2026-11-24) : même forme que celui de l'en-tête, flèche dans sa pastille.
 */
async function rendre(element) {
  const flux = await renderToReadableStream(element);
  await flux.allReady;
  return new Response(flux).text();
}

/** Les boutons d'appel d'un rendu, avec leur href. */
function boutons(html) {
  return [...html.matchAll(/<a [^>]*data-part="bouton-appel"[^>]*>/g)].map((m) => m[0]);
}

const site = await content.getSiteConfig();
const home = await content.getHome();
const works = await content.getWorks();

describe("boutons d'appel partagés", () => {
  it("menu flottant : un bouton pleine largeur vers le rendez-vous", async () => {
    const [bouton] = boutons(await rendre(createElement(FloatingNav, { site })));
    expect(bouton).toContain(`href="${site.primaryCta.href.replace(/&/g, "&amp;")}"`);
    expect(bouton).toContain("w-full");
  });

  it("menu flottant : le blog n'y figure plus", async () => {
    expect(await rendre(createElement(FloatingNav, { site }))).not.toContain('href="/blog"');
  });

  it("carte « pourquoi moi » : le rendez-vous prend le bouton, un autre lien garde la permutation", async () => {
    const html = await rendre(createElement(WhyUsSection, { whyUs: home.whyUs }));
    expect(boutons(html).length).toBe(1);
    const autre = { ...home.whyUs, ctas: [{ label: "Voir", href: "/realisations" }] };
    const sansRdv = await rendre(createElement(WhyUsSection, { whyUs: autre }));
    expect(boutons(sansRdv).length).toBe(0);
    expect(sansRdv).toContain('href="/realisations"');
    const sansLien = await rendre(createElement(WhyUsSection, { whyUs: { ...home.whyUs, ctas: [] } }));
    expect(boutons(sansLien).length).toBe(0);
  });

  it("services de l'accueil : un bouton par prestation, nommé par elle, hors tabulation replié", async () => {
    const html = await rendre(createElement(ServicesSection, { services: home.services.items ?? home.services }));
    const liste = boutons(html);
    expect(liste.length).toBeGreaterThan(0);
    for (const b of liste) expect(b).toContain("aria-label=");
    const items = home.services.items ?? home.services;
    const sansRdv = Array.isArray(items) ? items.map((i) => ({ ...i, rdvHref: undefined })) : items;
    const html2 = await rendre(createElement(ServicesSection, { services: sansRdv }));
    expect(boutons(html2).length).toBe(0);
  });

  it("réalisation : le bouton mène au sujet de la réalisation", async () => {
    const work = works.find((w) => w.sujetRendezVous) ?? works[0];
    const [bouton] = boutons(await rendre(createElement(WorkRendezVous, { work })));
    expect(bouton).toContain(`/rdv?sujet=${work.sujetRendezVous ?? "decouverte"}`);
    expect(bouton).toContain("h-[48px]");
  });

  it("page de prestation : l'offre et le bloc sur mesure", async () => {
    const html = await rendre(ServicePage({ prestation: prestations[0], site }));
    expect(boutons(html).length).toBeGreaterThanOrEqual(2);
  });

  it("hub des métiers : le bouton du bas de page", async () => {
    const html = await rendre(await HubMetiers());
    expect(boutons(html).some((b) => b.includes("/rdv?sujet=logiciel"))).toBe(true);
  });
});
