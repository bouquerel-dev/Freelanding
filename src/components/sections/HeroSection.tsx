import type { CSSProperties } from "react";
import type { HeroContent } from "@/lib/content/types";
import { Grain } from "@/components/effects/Grain";
import { lienRendezVous } from "@/content/rendez-vous";
import { uiLabels } from "@/content/ui";
import { AmbianceHeros } from "./hero/AmbianceHeros";
import { JeConstruis } from "./hero/JeConstruis";
import { VisageTrame } from "./hero/VisageTrame";

/**
 * Héros de l'accueil, version 2 « trame géante » (retenue par Eliott le
 * 2026-11-24) : à gauche il se présente, dit comment il travaille et ce qu'il
 * construit ; à droite son visage en grand, en trame de points, qui suit la
 * souris et se fond vers le texte.
 *
 * LARGEUR BORNÉE. Tout tient dans la colonne de 1440 du site : au-delà, le
 * texte et le visage ne s'écartent plus, ils restent ensemble au centre. Le
 * visage garde son rapport (voir `VisageTrame`), il se recadre sans s'étirer.
 *
 * Sous 1200 px, le visage passe au-dessus du texte, plus petit, fondu vers le
 * bas.
 *
 * MOUVEMENT. L'entrée reste celle du bloc `.hero-*` de `globals.css` (fondu
 * décalé par `--d`), en CSS, hors du fil principal.
 */

/**
 * Où tombent les trois repères, en pourcentage du cadre : une colonne calée à
 * droite, le trait tourné vers le visage, pour ne jamais toucher le texte.
 */
const POSITIONS_REPERES = ["top-[20%]", "top-[46%]", "top-[72%]"] as const;

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
      <span className="text-accent">{nom}</span>
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
      className="relative isolate w-full overflow-hidden bg-background [font-family:var(--font-sans)]"
    >
      <Grain opacity={0.1} className="z-0" />
      <AmbianceHeros />

      <div className="relative mx-auto flex min-h-[calc(100dvh/var(--zoom-ecran,1))] w-full max-w-[1440px] flex-col px-[20px] pt-[76px] pb-[44px] tablet:px-[30px] tablet:pt-[96px] desktop:min-h-[max(calc(100dvh/var(--zoom-ecran,1)),720px)] desktop:justify-center desktop:pt-[112px] desktop:pb-[72px]">
        {hero.person?.avatar ? (
          <div
            aria-hidden
            className="pointer-events-none relative z-0 -mx-[20px] h-[clamp(240px,40svh,360px)] tablet:-mx-[30px] tablet:h-[clamp(300px,40svh,440px)] desktop:absolute desktop:right-[30px] desktop:top-1/2 desktop:mx-0 desktop:h-[min(66vh,620px)] desktop:w-[50%] desktop:-translate-y-[40%]"
          >
            <div className="hero-visage absolute inset-0">
              <VisageTrame src="/images/eliott-portrait-large.jpg" centreOrdinateur={0.44} />
            </div>
            {/* Repères de viseur aux quatre coins du cadre (ordinateur seulement). */}
            <span className="hero-viseur absolute inset-0 hidden desktop:block" />
            {hero.faceNotes?.map((note, i) => (
              <span
                key={note}
                data-part="hero-repere"
                className={`hero-fond hero-repere absolute right-0 hidden items-center gap-[10px] whitespace-nowrap font-mono text-[11px] uppercase leading-none tracking-[0.04em] text-foreground-60 desktop:flex ${POSITIONS_REPERES[i] ?? ""}`}
                style={delai(700 + i * 120)}
              >
                <span className="text-accent">{String(i + 1).padStart(2, "0")}</span>
                {note}
              </span>
            ))}
          </div>
        ) : null}

        <div className="relative z-[1] -mt-[28px] flex flex-col items-start tablet:-mt-[40px] desktop:mt-0 desktop:max-w-[700px]">
          {hero.eyebrow ? (
            <p
              data-part="hero-salut"
              className="hero-fond m-0 text-[17px] font-medium leading-[1.3] tracking-[-0.02em] text-foreground tablet:text-[22px]"
              style={delai(0)}
            >
              <Salutation texte={hero.eyebrow} nom={hero.person?.name} />
            </p>
          ) : null}

          {/* LE SEUL h1 DE L'ACCUEIL, et l'élément LCP. `id="services"` : la
              marche « Prestations » des fils d'Ariane (`/#services`) y mène. */}
          <h1
            id="services"
            data-part="hero-titre"
            className="hero-fond m-0 mt-[14px] text-[clamp(28px,calc((100vw/var(--zoom-ecran,1)_-_40px)/10.9),48px)] font-semibold leading-[0.98] tracking-[-0.055em] text-foreground tablet:mt-[20px] tablet:text-[clamp(48px,calc(4.3vw/var(--zoom-ecran,1)),62px)]"
            style={delai(120)}
          >
            {avant}
            {/* Une phrase sur deux lignes, coupée après « prouver, » partout.
                Sur téléphone, la taille suit la largeur utile (écran moins
                les 40 px de marges) : la seconde ligne, la plus longue, mesure
                10,45 em, d'où le diviseur de 10,9 qui garde une marge. */}
            {apres ? (
              <>
                {" "}
                <br />
                {apres}
              </>
            ) : null}
          </h1>

          {hero.buildItems?.length ? (
            <div className="hero-fond mt-[20px] tablet:mt-[24px]" style={delai(320)}>
              <JeConstruis prefixe={hero.buildPrefix ?? ""} elements={hero.buildItems} />
            </div>
          ) : null}

          {sousTitre ? (
            <p
              data-part="hero-pour-qui"
              className="hero-fond m-0 mt-[16px] max-w-[48ch] text-[16px] font-medium leading-[1.45] tracking-[-0.01em] text-foreground-60 tablet:mt-[20px] tablet:text-[18px]"
              style={delai(420)}
            >
              {sousTitre}
            </p>
          ) : null}

          <div
            className="hero-fond mt-[26px] flex w-full flex-col gap-[10px] min-[480px]:w-auto min-[480px]:flex-row tablet:mt-[32px] tablet:gap-[14px]"
            style={delai(520)}
          >
            <a
              href={lienRendezVous("decouverte")}
              className="hero-cta flex h-[50px] flex-none items-center justify-center rounded-control bg-accent px-[22px] text-[13px] font-semibold uppercase leading-none tracking-[-0.01em] text-accent-ink no-underline"
            >
              {uiLabels.services.rdvLabel}
            </a>
            {hero.offerLink ? (
              <a
                href={hero.offerLink.href}
                data-part="hero-cta-secondaire"
                className="flex h-[50px] flex-none items-center justify-center rounded-control border border-white/30 px-[22px] text-[13px] font-semibold uppercase leading-none tracking-[-0.01em] text-foreground no-underline transition-colors duration-200 hover:border-foreground hover:bg-white/10"
              >
                {hero.offerLink.label}
              </a>
            ) : null}
          </div>
        </div>

        {/* Début du fil qui descend vers « Ce que je construis » (ordinateur). */}
        <span
          aria-hidden
          className="fil-suite fil-suite-debut pointer-events-none absolute bottom-0 left-[30px] hidden h-[96px] w-px desktop:block"
        />
      </div>
    </section>
  );
}
