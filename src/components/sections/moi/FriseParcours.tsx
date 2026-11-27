"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import Link from "next/link";
import type { EtapePlacee } from "./frise";

/**
 * LA FRISE QUI DÉFILE (2026-11-27). Sur ordinateur, la section se fige et le
 * défilement vertical fait glisser la piste à l'horizontale ; l'axe se remplit
 * de volt au fil des années. Ailleurs (téléphone, tablette, sans JavaScript),
 * la piste se fait glisser au doigt, sans épinglage : rien n'est jamais
 * coupé.
 */

const PALIER_EPINGLE = "(min-width: 1200px)";

function Carte({ p, enCoursLabel }: { p: EtapePlacee; enCoursLabel: string }) {
  const { etape } = p;
  const haut = p.ligne === "formation";
  const contenu = (
    <>
      <span className="font-mono text-[10px] uppercase leading-none tracking-[0.04em] text-foreground-60">
        {etape.periode}
      </span>
      <span className="text-[16px] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">{etape.structure}</span>
      {etape.court ? (
        <span className="text-[13px] leading-[1.3] tracking-[-0.01em] text-foreground-60">{etape.court}</span>
      ) : null}
      <span className="mt-[4px] flex items-center gap-[6px]">
        <span
          className={`rounded-full px-[7px] py-[4px] font-mono text-[9px] uppercase leading-none tracking-[0.05em] ${
            p.enCours ? "bg-accent text-accent-ink" : "border border-white/15 text-foreground-60"
          }`}
        >
          {etape.nature}
        </span>
        {p.enCours ? (
          <span className="flex items-center gap-[5px] font-mono text-[9px] uppercase leading-none tracking-[0.05em] text-accent">
            <span aria-hidden className="frise-pouls size-[6px] rounded-full bg-accent" />
            {enCoursLabel}
          </span>
        ) : null}
      </span>
    </>
  );
  const cls = `frise-carte flex w-[var(--carte)] flex-col gap-[6px] rounded-[14px] border p-[14px] no-underline backdrop-blur-[2px] transition-colors duration-200 ${
    p.enCours ? "border-accent/60 bg-accent/[0.06]" : "border-white/10 bg-[#121212] hover:border-white/25"
  }`;
  return (
    <li
      className="absolute"
      style={
        {
          left: `${p.debut * 100}%`,
          [haut ? "bottom" : "top"]: `calc(var(--rail) + ${p.rang} * var(--rangee))`,
        } as CSSProperties
      }
    >
      {/* Tige qui relie la carte à sa barre sur l'axe. */}
      <span
        aria-hidden
        className={`absolute left-0 w-px ${p.enCours ? "bg-accent/60" : "bg-white/20"} ${haut ? "top-full" : "bottom-full"}`}
        style={{ height: `calc(var(--rail) + ${p.rang} * var(--rangee) + var(--barre-ecart))` }}
      />
      {etape.href ? (
        <Link href={etape.href} className={cls}>
          {contenu}
        </Link>
      ) : (
        <div className={cls}>{contenu}</div>
      )}
    </li>
  );
}

function Piste({
  etapes,
  annees,
  aujourdhui,
  lignes,
  remplissage,
}: {
  etapes: EtapePlacee[];
  annees: number[];
  aujourdhui: number;
  lignes: { formation: string; experience: string; enCours: string };
  remplissage?: MotionValue<number>;
}) {
  const rangs = (l: EtapePlacee["ligne"]) => Math.max(1, ...etapes.filter((e) => e.ligne === l).map((e) => e.rang + 1));
  const style = {
    "--rangs-haut": rangs("formation"),
    "--rangs-bas": rangs("experience"),
    width: `calc(var(--an) * ${annees.length})`,
  } as CSSProperties;
  return (
    <div
      className="frise-piste relative flex-none [--an:300px] [--barre-ecart:18px] [--carte:180px] [--rail:34px] [--rangee:118px] tablet:[--an:340px] tablet:[--carte:200px] desktop:[--an:400px] desktop:[--carte:220px]"
      style={style}
    >
      {/* Les années en grand, en fond de chaque colonne. */}
      {annees.map((an, i) => (
        <span
          key={`fond-${an}`}
          aria-hidden
          className="pointer-events-none absolute bottom-0 select-none font-semibold leading-none tracking-[-0.06em] text-white/[0.03] [font-size:calc(var(--an)*0.3)]"
          style={{ left: `calc(${(i / annees.length) * 100}% + 12px)` }}
        >
          {an}
        </span>
      ))}

      {/* Ligne du haut : la formation. */}
      <div className="relative h-[calc(var(--rail)+var(--rangs-haut)*var(--rangee))]">
        <span className="absolute bottom-[var(--rail)] left-0 font-mono text-[11px] uppercase tracking-[0.04em] text-foreground-60">
          {lignes.formation}
        </span>
        <ul className="m-0 list-none p-0">
          {etapes.filter((e) => e.ligne === "formation").map((p) => (
            <Carte key={p.etape.structure} p={p} enCoursLabel={lignes.enCours} />
          ))}
        </ul>
      </div>

      {/* L'axe des années, les barres de durée de part et d'autre. */}
      <div className="relative h-[56px]">
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-white/12" />
        {remplissage ? (
          <motion.span
            aria-hidden
            className="absolute inset-x-0 top-[calc(50%-0.5px)] h-[2px] origin-left bg-accent"
            style={{ scaleX: remplissage }}
          />
        ) : null}
        {etapes.map((p) => (
          <span
            key={`barre-${p.etape.structure}`}
            aria-hidden
            className={`absolute h-[4px] rounded-full ${p.ligne === "formation" ? "top-[calc(50%-10px)]" : "top-[calc(50%+6px)]"} ${
              p.enCours ? "bg-gradient-to-r from-accent to-accent/0" : p.ligne === "formation" ? "bg-white/45" : "bg-accent/80"
            }`}
            style={{ left: `${p.debut * 100}%`, width: `max(4px, ${(p.fin - p.debut) * 100}%)` }}
          />
        ))}
        {annees.map((an, i) => (
          <span
            key={an}
            className="absolute top-1/2 flex -translate-y-1/2 items-center gap-[8px]"
            style={{ left: `${(i / annees.length) * 100}%` }}
          >
            <span aria-hidden className="h-[13px] w-px bg-white/40" />
            <span className="bg-background pr-[6px] font-mono text-[12px] leading-none tracking-[0.02em] text-foreground">{an}</span>
          </span>
        ))}
        <span
          aria-hidden
          className="absolute top-[-6px] bottom-[-6px] w-0 border-l border-dashed border-accent"
          style={{ left: `${aujourdhui * 100}%` }}
        />
      </div>

      {/* Ligne du bas : l'expérience. */}
      <div className="relative h-[calc(var(--rail)+var(--rangs-bas)*var(--rangee))]">
        <span className="absolute left-0 top-[var(--rail)] font-mono text-[11px] uppercase tracking-[0.04em] text-foreground-60">
          {lignes.experience}
        </span>
        <ul className="m-0 list-none p-0">
          {etapes.filter((e) => e.ligne === "experience").map((p) => (
            <Carte key={p.etape.structure} p={p} enCoursLabel={lignes.enCours} />
          ))}
        </ul>
      </div>
    </div>
  );
}

type Props = {
  etapes: EtapePlacee[];
  annees: number[];
  aujourdhui: number;
  lignes: { formation: string; experience: string; enCours: string };
  entete: React.ReactNode;
};

/** Ordinateur : la section se fige, le défilement vertical fait glisser la piste. */
function FriseEpinglee({ etapes, annees, aujourdhui, lignes, entete }: Props) {
  const cadre = useRef<HTMLDivElement>(null);
  const fenetre = useRef<HTMLDivElement>(null);
  const piste = useRef<HTMLDivElement>(null);
  const [debord, setDebord] = useState(0);

  useEffect(() => {
    const mesurer = () => {
      const f = fenetre.current;
      const p = piste.current;
      if (f && p) setDebord(Math.max(0, p.scrollWidth - f.clientWidth));
    };
    mesurer();
    const ro = new ResizeObserver(mesurer);
    if (fenetre.current) ro.observe(fenetre.current);
    return () => ro.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: cadre, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -debord]);
  const remplissage = useTransform(scrollYProgress, [0, 0.95], [0, aujourdhui]);

  return (
    <div ref={cadre} className="relative" style={{ height: `calc(100vh + ${debord}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center gap-[48px] overflow-hidden">
        {entete}
        <div ref={fenetre} className="relative">
          <motion.div ref={piste} style={{ x }} className="w-max pl-[max(30px,calc((100vw-1440px)/2+30px))] pr-[260px]">
            <Piste etapes={etapes} annees={annees} aujourdhui={aujourdhui} lignes={lignes} remplissage={remplissage} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function FriseParcours(props: Props) {
  const [epingle, setEpingle] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(PALIER_EPINGLE);
    const suivre = () => setEpingle(mq.matches);
    suivre();
    mq.addEventListener("change", suivre);
    return () => mq.removeEventListener("change", suivre);
  }, []);

  // Au doigt, la piste s'ouvre sur aujourd'hui : on remonte dans le temps.
  const glisse = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const g = glisse.current;
    if (g && !epingle) g.scrollLeft = g.scrollWidth;
  }, [epingle]);

  if (epingle) return <FriseEpinglee {...props} />;

  const { etapes, annees, aujourdhui, lignes, entete } = props;
  return (
    <div className="flex flex-col gap-[36px]">
      {entete}
      <div ref={glisse} className="frise-glisse overflow-x-auto pb-[8px]">
        <div className="w-max px-[20px] tablet:px-[30px]">
          <Piste etapes={etapes} annees={annees} aujourdhui={aujourdhui} lignes={lignes} />
        </div>
      </div>
    </div>
  );
}
