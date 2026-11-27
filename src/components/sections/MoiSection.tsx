import Link from "next/link";
import { aboutContent } from "@/content/about";
import { Grain } from "@/components/effects/Grain";
import { Highlighted } from "@/components/ui";
import type { AboutContent, HomeAboutSection } from "@/lib/content/types";
import { FriseParcours } from "./moi/FriseParcours";
import { placer, positionAujourdhui } from "./moi/frise";

/**
 * « MOI, C'EST ELIOTT » (2026-11-27, seconde passe, demande d'Eliott).
 *
 * Fond noir et trame comme le schéma juste au-dessus, plus d'aplat volt ni de
 * photo : le visiteur a déjà vu le visage dans le héros. Une phrase, deux
 * repères, puis la frise du parcours : formation au-dessus de l'axe des
 * années, expérience en dessous, l'étape en cours en volt. La nature de chaque
 * poste est écrite sur sa carte : aucun employeur ne passe pour un client.
 *
 * AVANT LE BAC (2026-11-27, troisième passe) : le récit de l'enfance ouvre la
 * frise, trois verbes et la phrase qui les relie au métier.
 */

function Prologue({ prologue }: { prologue: NonNullable<HomeAboutSection["prologue"]> }) {
  return (
    <div className="flex flex-col gap-[18px]">
      <p className="m-0 flex items-center gap-[10px] font-mono text-[12px] uppercase leading-[14px] text-accent before:h-px before:w-[28px] before:bg-accent/60 before:content-['']">
        {prologue.titre}
      </p>
      <ol className="m-0 list-none border-b border-white/10 p-0">
        {prologue.items.map((item) => (
          <li
            key={item.mot}
            className="grid gap-[4px] border-t border-white/10 py-[12px] tablet:grid-cols-[150px_1fr] tablet:items-baseline tablet:gap-[16px]"
          >
            <span className="text-[24px] font-semibold leading-[1] tracking-[-0.04em] text-foreground">{item.mot}</span>
            <span className="text-[14px] leading-[1.45] text-foreground-60">{item.texte}</span>
          </li>
        ))}
      </ol>
      <p className="m-0 max-w-[44ch] text-[17px] font-medium leading-[1.4] tracking-[-0.02em] text-foreground">{prologue.fil}</p>
    </div>
  );
}

const LIGNES_PAR_DEFAUT = { formation: "", experience: "", enCours: "", retenu: "" };

function groupe(parcours: AboutContent["parcours"], titre: string) {
  return parcours?.groupes.find((g) => g.titre === titre)?.etapes ?? [];
}

export function MoiSection({
  about,
  parcours = aboutContent.parcours,
  maintenant = new Date(),
}: {
  about: HomeAboutSection;
  /** Le parcours de `/a-propos` par défaut. */
  parcours?: AboutContent["parcours"];
  /** Date du rendu, pour placer « aujourd'hui » sur l'axe. */
  maintenant?: Date;
}) {
  const aujourdhui = maintenant.getFullYear() + maintenant.getMonth() / 12;
  const { etapes, de, a } = placer(
    [
      { ligne: "formation", etapes: groupe(parcours, "Formation") },
      { ligne: "experience", etapes: groupe(parcours, "Expérience") },
    ],
    aujourdhui,
  );
  const annees = Array.from({ length: a - de }, (_, i) => de + i);

  const entete = (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[18px] px-[20px] tablet:px-[30px] desktop:flex-row desktop:items-end desktop:justify-between">
      <div>
        {about.eyebrow ? (
          <p className="m-0 font-mono text-[12px] uppercase text-accent desktop:flex desktop:items-center desktop:gap-[10px] desktop:leading-[14px] desktop:before:h-px desktop:before:w-[28px] desktop:before:bg-accent/60 desktop:before:content-['']">
            {about.eyebrow}
          </p>
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
  );

  return (
    <section data-section="about" className="relative isolate bg-background py-[48px] tablet:py-[72px] desktop:py-0">
      <Grain opacity={0.1} className="z-0 hidden desktop:block" />
      <div className="relative">
        {etapes.length ? (
          <FriseParcours
            etapes={etapes}
            annees={annees}
            aujourdhui={positionAujourdhui(de, a, aujourdhui)}
            lignes={about.lignes ?? LIGNES_PAR_DEFAUT}
            entete={entete}
            prologue={about.prologue ? <Prologue prologue={about.prologue} /> : undefined}
          />
        ) : (
          entete
        )}
      </div>
    </section>
  );
}
