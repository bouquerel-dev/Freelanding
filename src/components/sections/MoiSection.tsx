import Link from "next/link";
import { aboutContent } from "@/content/about";
import { Grain } from "@/components/effects/Grain";
import { Highlighted } from "@/components/ui";
import type { AboutContent, HomeAboutSection, ParcoursEtape } from "@/lib/content/types";

/**
 * « MOI, C'EST ELIOTT » (2026-11-27, quatrième passe, demande d'Eliott).
 *
 * La frise horizontale épinglée est partie : trop grande pour ce qu'elle
 * contenait, avec des colonnes d'années vides. Le parcours se lit maintenant
 * d'un coup d'œil, en trois colonnes côte à côte sur ordinateur et l'une sous
 * l'autre ailleurs : avant le lycée, la formation, l'expérience. Chaque
 * colonne est un rail vertical, une étape par repère, l'étape en cours en
 * volt. Seules les périodes des étapes portent des années.
 */

const LIGNES_PAR_DEFAUT = { formation: "", experience: "", enCours: "", retenu: "" };

type Lignes = NonNullable<HomeAboutSection["lignes"]>;

function groupe(parcours: AboutContent["parcours"], titre: string): ParcoursEtape[] {
  const etapes = parcours?.groupes.find((g) => g.titre === titre)?.etapes ?? [];
  // Du plus ancien au plus récent : le récit se lit de haut en bas.
  const cle = (e: ParcoursEtape) => e.debut ?? "";
  return [...etapes].sort((a, b) => cle(a).localeCompare(cle(b)));
}

function TitreColonne({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 flex items-center gap-[10px] font-mono text-[12px] uppercase leading-[14px] text-accent before:h-px before:w-[28px] before:bg-accent/60 before:content-['']">
      {children}
    </p>
  );
}

/** Le repère d'une étape sur son rail : un carré net, volt pour l'étape en cours. */
function Repere({ actif }: { actif: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute left-[-4px] top-[3px] size-[9px] rounded-[2px] ${actif ? "frise-pouls bg-accent" : "border border-white/40 bg-background"}`}
    />
  );
}

function Etape({ etape, lignes }: { etape: ParcoursEtape; lignes: Lignes }) {
  const enCours = Boolean(etape.debut) && !etape.fin;
  const titre = <span className="text-[18px] font-semibold leading-[1.15] tracking-[-0.03em] text-foreground">{etape.structure}</span>;
  return (
    <li className="relative pb-[26px] pl-[22px] last:pb-0">
      <Repere actif={enCours} />
      <div className="flex flex-wrap items-center gap-x-[10px] gap-y-[6px]">
        <span className="font-mono text-[11px] uppercase leading-none tracking-[0.04em] text-foreground-60">{etape.periode}</span>
        <span
          className={`rounded-tag px-[7px] py-[4px] font-mono text-[10px] uppercase leading-none tracking-[0.05em] ${
            enCours ? "bg-accent text-accent-ink" : "border border-white/15 text-foreground-60"
          }`}
        >
          {etape.nature}
        </span>
        {enCours ? (
          <span className="font-mono text-[10px] uppercase leading-none tracking-[0.05em] text-accent">{lignes.enCours}</span>
        ) : null}
      </div>
      <div className="mt-[8px]">
        {etape.href ? (
          <Link href={etape.href} className="underline decoration-white/25 underline-offset-[4px] transition-colors hover:decoration-accent">
            {titre}
          </Link>
        ) : (
          titre
        )}
      </div>
      {etape.recit ?? etape.court ? (
        <p className="m-0 mt-[6px] max-w-[46ch] text-[14px] leading-[1.45] text-foreground-60">{etape.recit ?? etape.court}</p>
      ) : null}
      {etape.retenu ? (
        <p className="m-0 mt-[8px] text-[14px] leading-[1.4] text-foreground">
          <span className="mr-[8px] font-mono text-[10px] uppercase tracking-[0.05em] text-accent">{lignes.retenu}</span>
          {etape.retenu}
        </p>
      ) : null}
    </li>
  );
}

function Colonne({ titre, etapes, lignes }: { titre: string; etapes: ParcoursEtape[]; lignes: Lignes }) {
  return (
    <div className="flex flex-col gap-[22px]">
      <TitreColonne>{titre}</TitreColonne>
      <ol className="m-0 list-none border-l border-white/12 p-0">
        {etapes.map((etape) => (
          <Etape key={etape.structure} etape={etape} lignes={lignes} />
        ))}
      </ol>
    </div>
  );
}

function Prologue({ prologue }: { prologue: NonNullable<HomeAboutSection["prologue"]> }) {
  return (
    <div className="flex flex-col gap-[22px]">
      <TitreColonne>{prologue.titre}</TitreColonne>
      <ol className="m-0 list-none p-0">
        {prologue.items.map((item) => (
          <li key={item.mot} className="border-t border-white/10 py-[14px] first:border-t-0 first:pt-0">
            <span className={`block text-[22px] font-semibold leading-[1] tracking-[-0.04em] ${item.accent ? "text-accent" : "text-foreground"}`}>
              {item.mot}
            </span>
            <span className="mt-[8px] block text-[14px] leading-[1.45] text-foreground-60">{item.texte}</span>
          </li>
        ))}
      </ol>
      <p className="m-0 border-t border-white/10 pt-[16px] text-[16px] font-medium leading-[1.4] tracking-[-0.02em] text-foreground">{prologue.fil}</p>
    </div>
  );
}

export function MoiSection({
  about,
  parcours = aboutContent.parcours,
}: {
  about: HomeAboutSection;
  /** Le parcours de `/a-propos` par défaut. */
  parcours?: AboutContent["parcours"];
}) {
  const lignes = about.lignes ?? LIGNES_PAR_DEFAUT;
  const formation = groupe(parcours, "Formation");
  const experience = groupe(parcours, "Expérience");

  return (
    <section data-section="about" className="relative isolate bg-background py-[56px] tablet:py-[80px] desktop:py-[110px]">
      <Grain opacity={0.1} className="z-0 hidden desktop:block" />
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-[44px] px-[20px] tablet:px-[30px] desktop:gap-[64px]">
        <div className="flex flex-col gap-[18px] desktop:flex-row desktop:items-end desktop:justify-between">
          <div>
            {about.eyebrow ? (
              <p className="m-0 font-mono text-[12px] uppercase text-accent">{about.eyebrow}</p>
            ) : null}
            <h2 className="m-0 mt-[8px] text-[clamp(30px,5vw,52px)] font-semibold leading-[1] tracking-[-0.05em] text-foreground">
              {about.title}
            </h2>
            {about.body.map((phrase) => (
              <p key={phrase} className="m-0 mt-[8px] max-w-[52ch] text-[15px] leading-[1.45] text-foreground-60 tablet:text-[16px]">
                <Highlighted text={phrase} highlights={about.highlights} highlightClassName="text-foreground" />
              </p>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-[8px]">
            {about.faits?.map((fait) => (
              <span
                key={fait}
                className="rounded-tag border border-white/15 px-[10px] py-[7px] font-mono text-[11px] uppercase leading-none tracking-[0.04em] text-foreground"
              >
                {fait}
              </span>
            ))}
            {about.cta ? (
              <Link
                href={about.cta.href}
                className="rounded-tag px-[4px] py-[7px] text-[13px] font-medium text-foreground underline decoration-white/25 underline-offset-[4px] transition-colors hover:text-accent hover:decoration-accent"
              >
                {about.cta.label}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-[48px] tablet:grid-cols-2 tablet:gap-x-[40px] desktop:grid-cols-3 desktop:gap-x-[56px]">
          {about.prologue ? <Prologue prologue={about.prologue} /> : null}
          {formation.length ? <Colonne titre={lignes.formation} etapes={formation} lignes={lignes} /> : null}
          {experience.length ? <Colonne titre={lignes.experience} etapes={experience} lignes={lignes} /> : null}
        </div>
      </div>
    </section>
  );
}
