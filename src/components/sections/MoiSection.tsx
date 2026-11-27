import Image from "next/image";
import Link from "next/link";
import { aboutContent } from "@/content/about";
import { Highlighted } from "@/components/ui";
import type { HomeAboutSection, ParcoursEtape } from "@/lib/content/types";

/**
 * « MOI, C'EST ELIOTT » EN SCHÉMA (2026-11-27, demande d'Eliott : plus
 * concis, l'expérience et le parcours montrés plutôt que racontés).
 *
 * Une phrase et deux repères à gauche, la photo à droite, puis la frise des
 * postes, du premier stage à l'indépendance. La frise lit le groupe
 * « Expérience » de `/a-propos` : le parcours n'a qu'une source. La nature de
 * chaque poste (stage, alternance, freelance) est écrite sur la frise, aucun
 * employeur ne passe pour un client.
 *
 * L'encadré blanc qui se pose au défilement (`.about-cadre`) est gardé.
 */

/** Première année écrite dans la période : « Sept. 2024 à mai 2025 » → 2024. */
function annee(periode: string): string {
  return periode.match(/\d{4}/)?.[0] ?? periode;
}

function etapesChronologiques(): ParcoursEtape[] {
  const experience = aboutContent.parcours?.groupes.find((g) => g.titre === "Expérience");
  return [...(experience?.etapes ?? [])].reverse();
}

function Etape({ etape, derniere }: { etape: ParcoursEtape; derniere: boolean }) {
  const contenu = (
    <>
      <span className="font-mono text-[11px] uppercase leading-none tracking-[0.04em] text-accent-ink/60">
        {annee(etape.periode)}
      </span>
      <span className="text-[18px] font-semibold leading-[1.05] tracking-[-0.03em] text-accent-ink desktop:text-[20px]">
        {etape.structure}
      </span>
      {etape.court ? (
        <span className="text-[13px] font-medium leading-[1.3] tracking-[-0.01em] text-accent-ink/70">
          {etape.court}
        </span>
      ) : null}
      <span
        className={`mt-[2px] w-fit rounded-full px-[8px] py-[4px] font-mono text-[10px] uppercase leading-none tracking-[0.04em] ${
          derniere ? "bg-accent-ink text-accent" : "shadow-[inset_0_0_0_1px_rgb(10_10_10/0.22)] text-accent-ink/80"
        }`}
      >
        {etape.nature}
      </span>
    </>
  );
  return (
    <li className="relative flex flex-col pl-[28px] tablet:pl-0 tablet:pt-[30px]">
      {/* Le point posé sur le rail : à gauche sur téléphone, en haut dès la tablette. */}
      <span
        aria-hidden
        className={`absolute left-[3px] top-[2px] size-[11px] rounded-full tablet:left-0 tablet:top-[-5px] ${
          derniere ? "bg-accent-ink shadow-[0_0_0_4px_rgb(10_10_10/0.16)]" : "border-[1.5px] border-accent-ink bg-accent"
        }`}
      />
      {etape.href ? (
        <Link href={etape.href} className="group flex flex-col gap-[6px] no-underline">
          {contenu}
        </Link>
      ) : (
        <div className="flex flex-col gap-[6px]">{contenu}</div>
      )}
    </li>
  );
}

export function MoiSection({ about }: { about: HomeAboutSection }) {
  const etapes = etapesChronologiques();
  return (
    <section
      data-section="about"
      className="relative w-full bg-background px-[12px] py-[24px] tablet:px-[24px] tablet:py-[40px] desktop:px-[30px]"
    >
      <div className="about-cadre mx-auto w-full max-w-[1500px] rounded-[28px] bg-[#f4f4f1] p-[8px] tablet:rounded-[36px] tablet:p-[12px]">
        <div className="relative flex w-full flex-col gap-[40px] overflow-hidden rounded-[22px] bg-accent p-[20px] tablet:gap-[56px] tablet:rounded-[28px] tablet:p-[30px] desktop:p-[40px]">
          <div className="grid gap-[24px] tablet:grid-cols-[1fr_auto] tablet:items-end tablet:gap-[40px]">
            <div className="flex flex-col gap-[20px]">
              <h2 className="m-0 flex flex-col text-[clamp(40px,13vw,52px)] font-semibold uppercase leading-[0.9] tracking-[-0.055em] text-accent-ink tablet:text-[76px] desktop:text-[104px]">
                {(about.titleLines ?? [about.title]).map((ligne) => (
                  <span key={ligne} className="accent-room block">
                    {ligne}
                  </span>
                ))}
              </h2>
              {about.body.map((phrase) => (
                <p
                  key={phrase}
                  className="m-0 max-w-[44ch] text-[17px] font-medium leading-[1.4] tracking-[-0.01em] text-accent-ink/70 desktop:text-[19px]"
                >
                  <Highlighted text={phrase} highlights={about.highlights} highlightClassName="text-accent-ink" />
                </p>
              ))}
              {about.faits?.length ? (
                <ul className="m-0 flex list-none flex-wrap gap-[8px] p-0">
                  {about.faits.map((fait) => (
                    <li
                      key={fait}
                      className="rounded-full px-[12px] py-[7px] font-mono text-[11px] uppercase leading-none tracking-[0.04em] text-accent-ink shadow-[inset_0_0_0_1px_rgb(10_10_10/0.22)]"
                    >
                      {fait}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {about.image?.src ? (
              <div className="relative aspect-[4/5] w-[56%] max-w-[300px] overflow-hidden rounded-[18px] tablet:w-[240px] desktop:w-[300px]">
                <Image
                  src={about.image.src}
                  alt={about.image.alt ?? ""}
                  fill
                  sizes="(min-width: 1200px) 300px, (min-width: 810px) 240px, 56vw"
                  className="object-cover grayscale"
                />
              </div>
            ) : null}
          </div>

          {etapes.length ? (
            <div className="flex flex-col gap-[20px]">
              {about.parcoursLabel ? (
                <p className="m-0 font-mono text-[11px] uppercase leading-none tracking-[0.04em] text-accent-ink/60">
                  {about.parcoursLabel}
                </p>
              ) : null}
              <ol className="relative m-0 grid list-none gap-[26px] p-0 tablet:grid-cols-5 tablet:gap-[20px]">
                {/* Le rail : vertical sur téléphone, horizontal dès la tablette. */}
                <span aria-hidden className="absolute bottom-[8px] left-[8px] top-[8px] w-px bg-accent-ink/25 tablet:bottom-auto tablet:left-0 tablet:right-0 tablet:top-0 tablet:h-px tablet:w-auto" />
                {etapes.map((etape, i) => (
                  <Etape key={etape.structure} etape={etape} derniere={i === etapes.length - 1} />
                ))}
              </ol>
            </div>
          ) : null}

          {about.cta ? (
            <Link
              href={about.cta.href}
              className="w-fit text-[14px] font-semibold tracking-[-0.01em] text-accent-ink underline underline-offset-[3px]"
            >
              {about.cta.label} ↗
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
