import type { CSSProperties } from "react";
import type { HeroContent } from "@/lib/content/types";
import { Grain } from "@/components/effects/Grain";
import { lienRendezVous } from "@/content/rendez-vous";
import { uiLabels } from "@/content/ui";
import { JeConstruis } from "./hero/JeConstruis";
import { VisageTrame } from "./hero/VisageTrame";

/**
 * Héros de l'accueil, refait le 2026-11-24 (demande d'Eliott, d'après
 * rubenmarcus.dev) : une personne qui se présente, puis son avantage en une
 * phrase, puis comment il l'obtient.
 *
 * CE QUI EST PARTI, et pourquoi. La vidéo d'horlogerie, la barre du bas
 * (comparaison de prix et logos) et la porte unique vers le logiciel : Eliott
 * trouvait le message trop généraliste et la barre inutile, et le logiciel
 * métier ne doit plus passer avant les sites et l'IA.
 *
 * LE VISAGE EST DANS LE TITRE, au centre de la ligne de base : on voit qui
 * parle avant de lire ce qu'il vend.
 *
 * MOUVEMENT. L'entrée reste celle du bloc `.hero-*` de `globals.css` (fondu
 * décalé par `--d`), en CSS, hors du fil principal.
 */

function delai(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

/** Le nom de la personne, mis en valeur dans la phrase de salutation. */
function Salutation({ texte, nom }: { texte: string; nom?: string }) {
  const i = nom ? texte.indexOf(nom) : -1;
  if (!nom || i < 0) return <>{texte}</>;
  return (
    <>
      {texte.slice(0, i)}
      <span className="text-foreground">{nom}</span>
      {texte.slice(i + nom.length)}
    </>
  );
}

export function HeroSection({ hero }: { hero: HeroContent }) {
  const [avant, apres] = hero.titleLines ?? [hero.title];
  const sousTitre = hero.subtitleParagraphs?.[0]?.text ?? hero.subtitle;
  return (
    <section
      data-section="hero"
      className="relative isolate flex min-h-[calc(100dvh/var(--zoom-ecran,1))] w-full flex-col overflow-hidden bg-background pt-[96px] pb-[56px] [font-family:var(--font-sans)] tablet:min-h-[max(calc(100dvh/var(--zoom-ecran,1)),720px)] tablet:pt-[112px]"
    >
      {/* Filet central, signature de la grille du site. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 z-0 hidden w-px bg-white/[0.06] tablet:block"
      />
      {/* Halo volt derrière le titre (idée du héros de conduit.framer.ai). */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] z-0 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--accent)_14%,transparent),transparent)]"
      />
      <Grain opacity={0.1} className="z-0" />

      <div className="relative z-[1] mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center px-[20px] text-center tablet:px-[24px]">
        {hero.eyebrow ? (
          <p
            data-part="hero-salut"
            className="hero-fond m-0 max-w-[34ch] text-[17px] font-medium leading-[1.3] tracking-[-0.02em] text-foreground-60 tablet:max-w-none tablet:text-[22px]"
            style={delai(0)}
          >
            <Salutation texte={hero.eyebrow} nom={hero.person?.name} />
          </p>
        ) : null}

        {/* LE SEUL h1 DE L'ACCUEIL. `id="services"` : la marche « Prestations »
            des fils d'Ariane (`/#services`) y mène. */}
        <h1
          id="services"
          data-part="hero-titre"
          className="hero-fond m-0 mt-[18px] max-w-[18ch] text-[clamp(34px,calc(9.4vw/var(--zoom-ecran,1)),64px)] font-semibold leading-[1] tracking-[-0.055em] text-foreground [text-wrap:balance] tablet:mt-[24px] tablet:text-[clamp(64px,calc(6.4vw/var(--zoom-ecran,1)),100px)] tablet:leading-[0.98]"
          style={delai(120)}
        >
          {avant}
          <br />
          {hero.person?.avatar ? (
            <>
              <VisageTrame src="/images/eliott-portrait-large.jpg" />{" "}
            </>
          ) : null}
          {apres}
        </h1>

        {hero.buildItems?.length ? (
          <div className="hero-fond mt-[26px] tablet:mt-[32px]" style={delai(320)}>
            <JeConstruis prefixe={hero.buildPrefix ?? ""} elements={hero.buildItems} />
          </div>
        ) : null}

        {sousTitre ? (
          <p
            data-part="hero-pour-qui"
            className="hero-fond m-0 mt-[18px] max-w-[54ch] text-[16px] font-medium leading-[1.45] tracking-[-0.01em] text-foreground-60 [text-wrap:balance] tablet:mt-[22px] tablet:text-[18px]"
            style={delai(420)}
          >
            {sousTitre}
          </p>
        ) : null}

        <div
          className="hero-fond mt-[28px] flex flex-col items-center gap-[12px] tablet:mt-[34px] tablet:flex-row tablet:gap-[14px]"
          style={delai(520)}
        >
          <a
            href={lienRendezVous("decouverte")}
            className="hero-cta flex h-[50px] flex-none items-center justify-center rounded-[12px] bg-accent px-[22px] text-[13px] font-semibold uppercase leading-none tracking-[-0.01em] text-accent-ink no-underline"
          >
            {uiLabels.services.rdvLabel}
          </a>
          {hero.offerLink ? (
            <a
              href={hero.offerLink.href}
              data-part="hero-cta-secondaire"
              className="flex h-[50px] flex-none items-center justify-center rounded-[12px] border border-white/30 px-[22px] text-[13px] font-semibold uppercase leading-none tracking-[-0.01em] text-foreground no-underline transition-colors duration-200 hover:border-foreground hover:bg-white/10"
            >
              {hero.offerLink.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
