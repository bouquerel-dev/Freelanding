import Link from "next/link";
import { BoutonAppel } from "@/components/ui/BoutonAppel";
import { Icon } from "@/components/ui";
import { Reveal } from "@/components/motion/Reveal";
import { CompteurDefilement } from "@/components/motion/CompteurDefilement";
import { Ouverture } from "@/components/motion/Ouverture";
import { EtiquetteDemi, TitreDemi } from "@/components/sections/demi/TitreDemi";
import type { HomeContent, Link as LinkData, Stat } from "@/lib/content/types";

/**
 * « POURQUOI MOI », EN DEUX PARTIES SUR FOND BLANC (2026-11-27, demande
 * d'Eliott : retrouver la DA d'origine, des moitiés splittées, aérées et
 * lisibles, en alternance avec le volt).
 *
 * Avant : la moitié gauche ne portait que l'étiquette, tout le texte (soixante
 * mots d'un bloc) et une carte isolée tenaient à droite. Le titre géant prend
 * maintenant la moitié gauche, épinglé pendant qu'on lit la droite : la
 * conviction, trois arguments numérotés séparés par des filets, puis le chiffre
 * de propriété et le rendez-vous, sur la même grille de filets (plus de carte
 * noire : la revue design du 2026-11-27 y lisait un gabarit de template).
 *
 * Le fond s'ouvre depuis le gris des réalisations (`Ouverture`).
 */

const ENCRE = "text-background";

function parseStat(stat: Stat): { target: number; decimals: number } {
  const suffix = stat.suffix ?? "";
  const base = suffix && stat.value.endsWith(suffix) ? stat.value.slice(0, -suffix.length) : stat.value;
  const target = Number.parseFloat(base) || 0;
  const dot = base.indexOf(".");
  const decimals = stat.format === "decimal" ? (dot >= 0 ? base.length - dot - 1 : 1) : 0;
  return { target, decimals };
}

/** Lien secondaire : libellé qui permute au survol, flèche. */
function SwapLink({ cta }: { cta: LinkData }) {
  const swap = "transition-transform duration-[105ms] ease-out motion-reduce:transition-none";
  const inner = (
    <>
      <span className={`relative block whitespace-pre group-hover:translate-y-[14px] ${swap}`}>{cta.label}</span>
      <span
        aria-hidden
        className={`pointer-events-none absolute left-0 top-0 block -translate-y-[14px] whitespace-pre group-hover:translate-y-0 ${swap}`}
      >
        {cta.label}
      </span>
      <Icon name="arrow-up-right" size={15} className={`shrink-0 ${ENCRE}`} />
    </>
  );
  const cls = `group relative inline-flex w-fit items-center gap-[4px] overflow-hidden whitespace-pre text-[13px] font-medium leading-[1.2] tracking-[-0.01em] no-underline ${ENCRE}`;
  return cta.external ? (
    <a href={cta.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={cta.href} className={cls}>
      {inner}
    </Link>
  );
}

function Preuve({ stat, cta }: { stat: Stat; cta?: LinkData }) {
  const { target, decimals } = parseStat(stat);
  return (
    <Reveal
      as="div"
      className="relative flex w-full flex-col gap-[24px] border-t border-background/15 pt-[28px] tablet:flex-row tablet:items-end tablet:justify-between"
      initialOpacity={0.001}
      initialY={16}
      duration={0.7}
      delay={0.2}
    >
      <div className="flex items-end gap-[16px]">
        <p className={`m-0 flex items-baseline text-[64px] font-semibold leading-[0.85] tracking-[-0.06em] tablet:text-[80px] ${ENCRE}`}>
          <span>{stat.prefix ?? ""}</span>
          <CompteurDefilement cible={target} decimales={decimals} libelle={target.toFixed(decimals)} />
          <span>{stat.suffix ?? ""}</span>
        </p>
        <p className="m-0 max-w-[220px] pb-[6px] text-[15px] font-medium leading-[1.3] tracking-[-0.01em] text-background/70 [text-wrap:balance]">
          {stat.label}
        </p>
      </div>
      {cta?.href.startsWith("/rdv") ? (
        <BoutonAppel href={cta.href} label={cta.label} taille="grand" ton="encre" />
      ) : cta ? (
        <SwapLink cta={cta} />
      ) : null}
    </Reveal>
  );
}

export function WhyUsSection({ whyUs }: { whyUs: HomeContent["whyUs"] }) {
  const [preuve] = whyUs.stats;
  const cta = whyUs.ctas?.[0];
  return (
    <section
      data-section="whyus"
      className="relative flex w-full flex-col items-center overflow-hidden px-[20px] py-[72px] [font-family:var(--font-sans)] tablet:px-[24px] tablet:py-[130px] desktop:px-[30px] desktop:py-[170px]"
    >
      <Ouverture fond="bg-papier" autour="bg-muted" filet="bg-background/10" />
      <div className="relative z-[1] grid w-full max-w-[1440px] grid-cols-1 gap-[44px] tablet:grid-cols-2 tablet:gap-0">
        <div className="relative tablet:pr-[30px]">
          <div className="flex flex-col gap-[24px] tablet:sticky tablet:top-[120px] tablet:gap-[36px]">
            {whyUs.eyebrow ? <EtiquetteDemi texte={whyUs.eyebrow} encre={ENCRE} /> : null}
            <TitreDemi lignes={whyUs.titleLines ?? [whyUs.title ?? ""]} encre={ENCRE} />
          </div>
        </div>

        <div className="flex flex-col gap-[44px] tablet:gap-[56px] tablet:pl-[30px] desktop:pl-[60px]">
          {whyUs.intro ? (
            <Reveal
              as="p"
              className={`m-0 max-w-[560px] text-[24px] font-medium leading-[1.2] tracking-[-0.02em] [text-wrap:pretty] tablet:text-[28px] desktop:text-[32px] ${ENCRE}`}
              initialOpacity={0.001}
              initialY={24}
              duration={0.8}
            >
              {whyUs.intro}
            </Reveal>
          ) : null}

          <ol className="m-0 flex list-none flex-col p-0">
            {whyUs.points.map((point, i) => (
              <Reveal
                as="li"
                key={point.titre}
                className="grid grid-cols-[44px_1fr] gap-x-[10px] gap-y-[8px] border-t border-background/15 py-[22px] tablet:grid-cols-[64px_1fr] tablet:py-[28px]"
                initialOpacity={0.001}
                initialY={16}
                duration={0.7}
                delay={0.08 * i}
              >
                <span aria-hidden className="pt-[5px] text-[12px] font-medium tabular-nums leading-[1.2] text-background/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-[8px]">
                  <p className={`m-0 text-[20px] font-semibold leading-[1.15] tracking-[-0.02em] tablet:text-[22px] ${ENCRE}`}>
                    {point.titre}
                  </p>
                  <p className="m-0 max-w-[460px] text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-background/70">
                    {point.texte}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>

          {preuve ? <Preuve stat={preuve} cta={cta} /> : null}
        </div>
      </div>
    </section>
  );
}
