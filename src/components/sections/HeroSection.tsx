import type { CSSProperties } from "react";
import { preload } from "react-dom";
import type { HeroContent, PartieVisage } from "@/lib/content/types";
import { Grain } from "@/components/effects/Grain";
import { BoutonAppel } from "@/components/ui/BoutonAppel";
import { lienRendezVous } from "@/content/rendez-vous";
import { uiLabels } from "@/content/ui";
import { AmbianceHeros } from "./hero/AmbianceHeros";
import { JeConstruis } from "./hero/JeConstruis";
import { PortraitCouleur } from "./hero/PortraitCouleur";
import { VisageTrame } from "./hero/VisageTrame";

/**
 * Héros de l'accueil, version 2 « trame géante » (retenue par Eliott le
 * 2026-11-24) : à gauche il se présente, dit comment il travaille et ce qu'il
 * construit ; à droite sa photo en grand, dont la trame de points ne revient
 * que sous la lampe de la souris, et six traits accrochés au visage.
 *
 * LARGEUR BORNÉE. Tout tient dans la colonne de 1440 du site : au-delà, le
 * texte et le visage ne s'écartent plus, ils restent ensemble au centre. Le
 * visage garde son rapport (voir `VisageTrame`), il se recadre sans s'étirer.
 *
 * Sous 1200 px, le portrait (photo, trame et six traits) passe au-dessus du
 * texte, à la largeur de l'écran, fondu vers le bas sous le titre.
 *
 * HAUTEUR. Sur ordinateur, le héros laisse 270 px d'écran au schéma qui suit,
 * pour qu'on le voie arriver et qu'on ait envie de descendre.
 *
 * MOUVEMENT. L'entrée du texte reste celle du bloc `.hero-*` de `globals.css`
 * (fondu décalé par `--d`, jamais d'opacité nulle : le titre reste le LCP).
 * Le portrait arrive en trois temps : lueur, trame qui naît en vague, photo du
 * flou au net (voir `PortraitCouleur`).
 */

/**
 * LA SCÈNE DU PORTRAIT (2026-11-24, refonte). Un carré qui porte, l'un sur
 * l'autre, exactement le même cadre : la photo couleur détourée (1024 × 1024),
 * la trame de points tirée de la même photo, les six traits. Tout se place en
 * pourcentage du carré, donc la trame couvre toute la photo et la lampe de la
 * souris n'a plus de bord.
 *
 * Taille du carré (`--s`, posée sur le conteneur) : la largeur de l'écran sur
 * téléphone, bornée à 460 px ; sur ordinateur, 86 % de la hauteur d'écran,
 * bornée à 780 px. Le bas de la photo se fond à 82 % du carré.
 *
 * POINTS D'ACCROCHE, relevés sur la photo source : `u` en largeur, `v` en
 * hauteur. Les étiquettes s'alignent en deux colonnes (`colonne`) : côté titre
 * elles finissent toutes à la colonne gauche, côté bord elles commencent à la
 * colonne droite. Sur ordinateur, chaque étiquette est à la hauteur de son
 * point (trait horizontal) ; sur téléphone, les étiquettes se rangent plus haut
 * (`vMobile`) pour laisser le bas au titre, et le trait part en biais.
 */
const POINTS_VISAGE: Record<PartieVisage, { u: number; v: number; vMobile: number; vPointMobile?: number; gauche: boolean }> = {
  front: { u: 0.504, v: 0.353, vMobile: 0.3, gauche: true },
  // Au coin extérieur de l'œil, côté titre : l'œil reste visible.
  oeil: { u: 0.417, v: 0.406, vMobile: 0.4, gauche: true },
  bouche: { u: 0.51, v: 0.502, vMobile: 0.5, gauche: true },
  oreille: { u: 0.66, v: 0.427, vMobile: 0.36, gauche: false },
  epaule: { u: 0.744, v: 0.679, vMobile: 0.6, gauche: false },
  // Au téléphone, le titre recouvre le bas de la photo : le cœur remonte.
  coeur: { u: 0.58, v: 0.768, vMobile: 0.48, vPointMobile: 0.7, gauche: false },
};
const COLONNES = {
  ordinateur: { gauche: 0.302, droite: 0.794 },
  mobile: { gauche: 0.38, droite: 0.68 },
} as const;

function pc(n: number) {
  return `${Math.round(n * 1000) / 10}%`;
}

/** Les traits d'un format : de la colonne d'étiquettes jusqu'au point du visage. */
function Traits({ format }: { format: keyof typeof COLONNES }) {
  const colonne = COLONNES[format];
  return (
    <svg
      aria-hidden
      className={`hero-traits absolute inset-0 h-full w-full overflow-visible ${format === "ordinateur" ? "hidden desktop:block" : "desktop:hidden"}`}
    >
      {Object.entries(POINTS_VISAGE).map(([partie, p], i) => {
        // Au téléphone, le trait part sous l'étiquette pour ne jamais la barrer.
        const y = format === "ordinateur" ? p.v : p.vMobile + 0.045;
        const x = p.gauche ? colonne.gauche : colonne.droite;
        return (
          <line
            key={partie}
            x1={pc(x)}
            y1={pc(y)}
            x2={pc(p.u)}
            y2={pc(format === "ordinateur" ? p.v : (p.vPointMobile ?? p.v))}
            pathLength={1}
            className="hero-trait-ligne"
            style={delai(420 + i * 90)}
          />
        );
      })}
    </svg>
  );
}

function placeEtiquette(partie: PartieVisage): CSSProperties {
  const p = POINTS_VISAGE[partie];
  return {
    "--y-m": pc(p.vMobile),
    "--y-d": pc(p.v),
    "--x-m": pc(p.gauche ? 1 - COLONNES.mobile.gauche : COLONNES.mobile.droite),
    "--x-d": pc(p.gauche ? 1 - COLONNES.ordinateur.gauche : COLONNES.ordinateur.droite),
  } as CSSProperties;
}

/** Petite trame (320 px, 8 ko) tirée de la photo couleur : elle arrive avant la photo. */
const TRAME_PORTRAIT = "/images/eliott-portrait-trame.webp";

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
  // La trame est le premier visuel du portrait : demandée dès le HTML.
  if (hero.person?.avatar) preload(TRAME_PORTRAIT, { as: "image", type: "image/webp" });
  return (
    <section
      data-section="hero"
      className="relative isolate w-full overflow-hidden bg-background [font-family:var(--font-sans)]"
    >
      <Grain opacity={0.1} className="z-0" />
      <AmbianceHeros />

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col px-[20px] pt-[20px] pb-[36px] [--s:min(calc(100vw/var(--zoom-ecran,1)),460px)] tablet:px-[30px] tablet:pt-[40px] desktop:min-h-[max(calc(100dvh/var(--zoom-ecran,1)_-_270px),600px)] desktop:justify-center desktop:pt-[104px] desktop:pb-[56px] desktop:[--s:min(86vh,780px)]">
        {hero.person?.avatar ? (
          <div
            aria-hidden
            data-scene
            className="hero-scene pointer-events-none relative z-0 h-[var(--s)] self-center w-[var(--s)] flex-none desktop:absolute desktop:left-[calc(72%_-_var(--s)/2)] desktop:top-0 desktop:self-auto"
          >
            {/* La photo couleur, puis la trame de la même photo par-dessus :
                pendant le chargement, la trame naît seule ; la photo arrive
                ensuite, du flou au net, et la trame ne reste que sous la lampe
                de la souris (ordinateur). */}
            <PortraitCouleur src="/images/eliott-portrait-couleur.webp" />
            <div className="hero-visage absolute inset-0">
              <VisageTrame src={TRAME_PORTRAIT} />
            </div>
            <Traits format="mobile" />
            <Traits format="ordinateur" />
            {hero.faceNotes?.map((trait, i) => {
              const p = POINTS_VISAGE[trait.partie];
              return (
                <span key={trait.partie} className="contents">
                  <span
                    className="hero-repere-point absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ left: pc(p.u), "--pt-m": pc(p.vPointMobile ?? p.v), "--pt-d": pc(p.v), ...delai(300 + i * 90) } as CSSProperties}
                  />
                  <span
                    data-part="hero-repere"
                    data-cote={p.gauche ? "gauche" : "droite"}
                    className="hero-etiquette hero-fond absolute flex flex-col gap-[3px] whitespace-nowrap [text-shadow:0_0_3px_rgb(10_10_10),0_1px_12px_rgb(10_10_10)] desktop:gap-[4px]"
                    style={{ ...placeEtiquette(trait.partie), ...delai(560 + i * 90) }}
                  >
                    <span className="font-mono text-[10px] uppercase leading-none tracking-[0.04em] text-foreground desktop:text-[11px]">{trait.titre}</span>
                    <span className="text-[11px] leading-[1.2] tracking-[-0.01em] text-foreground-60 desktop:text-[12px]">{trait.detail}</span>
                  </span>
                </span>
              );
            })}
          </div>
        ) : null}

        <div className="relative z-[1] -mt-[calc(var(--s)*0.26)] flex flex-col items-start desktop:mt-0 desktop:max-w-[700px]">
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
            className="hero-fond m-0 mt-[14px] text-[clamp(28px,calc((100vw/var(--zoom-ecran,1)_-_40px)/10.9),48px)] font-semibold leading-[0.98] tracking-[-0.055em] text-foreground tablet:mt-[20px] tablet:text-[clamp(48px,calc(4vw/var(--zoom-ecran,1)),62px)]"
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
            className="hero-fond mt-[26px] flex w-full flex-col gap-[10px] tablet:w-auto tablet:flex-row tablet:mt-[32px] tablet:gap-[14px]"
            style={delai(520)}
          >
            {/* Le bouton partagé de l'en-tête, en grand : même habillage, même logo. */}
            <BoutonAppel href={lienRendezVous("decouverte")} label={uiLabels.services.rdvLabel} taille="grand" largeur="pleine-mobile" data-part="hero-cta" />
            {hero.offerLink ? (
              <BoutonAppel
                href={hero.offerLink.href}
                label={hero.offerLink.label}
                taille="grand"
                ton="encre"
                largeur="pleine-mobile"
                data-part="hero-cta-secondaire"
              />
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
