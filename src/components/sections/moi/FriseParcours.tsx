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
 *
 * SECONDE PASSE (2026-11-27, relecture d'Eliott). Plus aucune forme en
 * pilule : étiquettes au rayon `tag`, cartes au rayon `control` (squircle là
 * où le navigateur le dessine), barres de durée à angles quasi droits. Les
 * années deviennent des repères lisibles sur l'axe, une colonne chacune. Le
 * récit précède la piste (« Avant le bac ») et elle se lit dans l'ordre, de
 * la terminale à aujourd'hui.
 */

const PALIER_EPINGLE = "(min-width: 1200px)";

export type Lignes = { formation: string; experience: string; enCours: string; retenu: string };

function Carte({ p, lignes }: { p: EtapePlacee; lignes: Lignes }) {
  const { etape } = p;
  const haut = p.ligne === "formation";
  const contenu = (
    <>
      <span className="font-mono text-[11px] uppercase leading-none tracking-[0.04em] text-foreground-60">{etape.periode}</span>
      <span className="text-[18px] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">{etape.structure}</span>
      {etape.recit ?? etape.court ? (
        <span className="text-[13px] leading-[1.4] tracking-[-0.01em] text-foreground-60">{etape.recit ?? etape.court}</span>
      ) : null}
      {etape.retenu ? (
        <span className="mt-[2px] border-t border-white/10 pt-[9px] text-[13px] leading-[1.35] tracking-[-0.01em] text-foreground">
          <span className="mr-[6px] font-mono text-[10px] uppercase tracking-[0.05em] text-accent">{lignes.retenu}</span>
          {etape.retenu}
        </span>
      ) : null}
      <span className="mt-[2px] flex items-center gap-[8px]">
        <span
          className={`rounded-tag px-[7px] py-[4px] font-mono text-[10px] uppercase leading-none tracking-[0.05em] ${
            p.enCours ? "bg-accent text-accent-ink" : "border border-white/15 text-foreground-60"
          }`}
        >
          {etape.nature}
        </span>
        {p.enCours ? (
          <span className="flex items-center gap-[6px] font-mono text-[10px] uppercase leading-none tracking-[0.05em] text-accent">
            <span aria-hidden className="frise-pouls size-[6px] rounded-full bg-accent" />
            {lignes.enCours}
          </span>
        ) : null}
      </span>
    </>
  );
  const cls = `frise-carte flex w-[var(--carte)] flex-col gap-[8px] rounded-control border p-[14px] no-underline transition-colors duration-200 ${
    p.enCours ? "border-accent/60 bg-[#141609]" : "border-white/10 bg-[#121212] hover:border-white/25"
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
  lignes: Lignes;
  remplissage?: MotionValue<number>;
}) {
  const rangs = (l: EtapePlacee["ligne"]) => Math.max(1, ...etapes.filter((e) => e.ligne === l).map((e) => e.rang + 1));
  const style = {
    "--rangs-haut": rangs("formation"),
    "--rangs-bas": rangs("experience"),
    width: `calc(var(--an) * ${annees.length})`,
  } as CSSProperties;
  // L'année en cours : sa colonne contient « aujourd'hui ».
  const anCourant = annees[Math.min(annees.length - 1, Math.floor(aujourdhui * annees.length))];
  return (
    <div
      className="frise-piste relative flex-none [--an:440px] [--barre-ecart:26px] [--carte:204px] [--rail:24px] [--rangee:300px] desktop:[--an:480px] desktop:[--rangee:252px] desktop:[--carte:224px]"
      style={style}
    >
      {/* Une colonne par année : un filet qui traverse toute la piste. */}
      {annees.map((an, i) => (
        <span
          key={`colonne-${an}`}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-px bg-white/[0.06]"
          style={{ left: `${(i / annees.length) * 100}%` }}
        />
      ))}

      {/* Ligne du haut : la formation. */}
      <div className="relative h-[calc(var(--rail)+var(--rangs-haut)*var(--rangee))]">
        <span className="absolute bottom-[var(--rail)] left-[12px] whitespace-nowrap desktop:left-auto desktop:right-[calc(100%+16px)] font-mono text-[11px] uppercase tracking-[0.04em] text-foreground-60">
          {lignes.formation}
        </span>
        <ul className="m-0 list-none p-0">
          {etapes.filter((e) => e.ligne === "formation").map((p) => (
            <Carte key={p.etape.structure} p={p} lignes={lignes} />
          ))}
        </ul>
      </div>

      {/* L'axe des années, les barres de durée de part et d'autre. */}
      <div className="relative h-[68px]">
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-white/15" />
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
            className={`absolute h-[6px] rounded-[2px] ${p.ligne === "formation" ? "top-[calc(50%-26px)]" : "top-[calc(50%+20px)]"} ${
              p.enCours ? "bg-gradient-to-r from-accent to-accent/0" : p.ligne === "formation" ? "bg-white/50" : "bg-accent/80"
            }`}
            style={{ left: `${p.debut * 100}%`, width: `max(6px, ${(p.fin - p.debut) * 100}%)` }}
          />
        ))}
        {annees.map((an, i) => (
          <span
            key={an}
            className={`absolute top-1/2 -translate-y-1/2 rounded-tag border bg-background px-[10px] py-[6px] text-[20px] font-semibold leading-none tracking-[-0.03em] tabular-nums ${
              an === anCourant ? "border-accent/70 text-accent" : "border-white/20 text-foreground"
            }`}
            style={{ left: `${(i / annees.length) * 100}%` }}
          >
            {an}
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
        <span className="absolute left-[12px] top-[var(--rail)] whitespace-nowrap desktop:left-auto desktop:right-[calc(100%+16px)] font-mono text-[11px] uppercase tracking-[0.04em] text-foreground-60">
          {lignes.experience}
        </span>
        <ul className="m-0 list-none p-0">
          {etapes.filter((e) => e.ligne === "experience").map((p) => (
            <Carte key={p.etape.structure} p={p} lignes={lignes} />
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
  lignes: Lignes;
  entete: React.ReactNode;
  /** Ce qui précède les études : avant la piste sur ordinateur, au-dessus ailleurs. */
  prologue?: React.ReactNode;
};

/** Ordinateur : la section se fige, le défilement vertical fait glisser la piste. */
function FriseEpinglee({ etapes, annees, aujourdhui, lignes, entete, prologue }: Props) {
  const cadre = useRef<HTMLDivElement>(null);
  const fenetre = useRef<HTMLDivElement>(null);
  const piste = useRef<HTMLDivElement>(null);
  const [debord, setDebord] = useState(0);

  useEffect(() => {
    // Les deux éléments sont rendus sans condition par ce composant : après
    // le montage, leurs refs sont toujours posées.
    const f = fenetre.current as HTMLDivElement;
    const p = piste.current as HTMLDivElement;
    const mesurer = () => setDebord(Math.max(0, p.scrollWidth - f.clientWidth));
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(f);
    // La piste change aussi seule : prologue, polices chargées en retard.
    ro.observe(p);
    return () => ro.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: cadre, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -debord]);
  const remplissage = useTransform(scrollYProgress, [0.1, 0.95], [0, aujourdhui]);

  return (
    <div ref={cadre} className="relative" style={{ height: `calc(100vh + ${debord}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center gap-[28px] overflow-hidden">
        {entete}
        <div ref={fenetre} className="relative">
          <motion.div
            ref={piste}
            style={{ x }}
            className="flex w-max items-center gap-[150px] pl-[max(30px,calc((100vw-1440px)/2+30px))] pr-[260px]"
          >
            {prologue ? <div className="w-[500px] flex-none">{prologue}</div> : null}
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

  // Au doigt, le récit est au-dessus et la piste se lit dans l'ordre : elle
  // s'ouvre sur la première étape, pas sur une colonne vide.
  const glisse = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (epingle) return;
    // Rendu sans condition quand la frise n'est pas épinglée.
    const g = glisse.current as HTMLDivElement;
    // La position de la première carte n'est juste qu'une fois la piste
    // mise en page : on la reprend à chaque mesure, jusqu'à pouvoir ouvrir.
    const ouvrir = () => {
      const premiere = g.querySelector(".frise-carte") as HTMLElement;
      const ecart = premiere.getBoundingClientRect().left - g.getBoundingClientRect().left + g.scrollLeft - 20;
      if (ecart > 0) {
        g.scrollLeft = ecart;
        ro.disconnect();
      }
    };
    const ro = new ResizeObserver(ouvrir);
    ro.observe(g.firstElementChild as Element);
    ouvrir();
    return () => ro.disconnect();
  }, [epingle]);

  if (epingle) return <FriseEpinglee {...props} />;

  const { etapes, annees, aujourdhui, lignes, entete, prologue } = props;
  return (
    <div className="flex flex-col gap-[36px]">
      {entete}
      {prologue ? <div className="px-[20px] tablet:px-[30px]">{prologue}</div> : null}
      <div ref={glisse} className="frise-glisse overflow-x-auto pb-[8px]">
        <div className="w-max px-[20px] tablet:px-[30px]">
          <Piste etapes={etapes} annees={annees} aujourdhui={aujourdhui} lignes={lignes} />
        </div>
      </div>
    </div>
  );
}
