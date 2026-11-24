"use client";

import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Grain } from "@/components/effects/Grain";
import type { NoeudSchema, SchemaContent } from "@/content/schema";

/**
 * « CE QUE JE CONSTRUIS » (2026-11-24) : le schéma de conduit.framer.ai, en
 * compact, sur trois onglets (site, logiciel, IA). Une demande entre à gauche,
 * passe par le cœur, sort à droite ; le cœur avance d'une étape toutes les
 * 1,4 s et la sortie atteinte s'allume. Les liens sont tracés en SVG à partir
 * de la position réelle des cartes, recalculée au redimensionnement.
 *
 * Mouvement réduit : pas de défilement des étapes ni des tirets.
 *
 * RACCORD AVEC LE HÉROS (2026-11-24). Même colonne que le héros (1440, marges
 * de 20 puis 30 px), même grain sur ordinateur, et le fil parti du bas du
 * héros descend sur la marge gauche puis tourne dans le trait du sur-titre.
 * Sur ordinateur, l'en-tête puis les cartes entrent en cascade la première
 * fois que la section paraît.
 *
 * HORS ÉCRAN, RIEN NE TOURNE : le pas du cœur s'arrête et la section reçoit
 * `data-schema="pause"`, qui fige les tirets des liens et la goutte du fil.
 */

const PAS_MS = 1400;

/** Décalage d'entrée en cascade (ordinateur), lu par `.schema-entree`. */
function delai(ms: number) {
  return { "--d": `${ms}ms` } as CSSProperties;
}

function Noeud({ noeud, actif, fait, ordre }: { noeud: NoeudSchema; actif?: boolean; fait: string; ordre: number }) {
  return (
    <div
      data-noeud
      style={delai(260 + ordre * 60)}
      className={`schema-entree relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-[10px] rounded-[14px] border bg-surface-1 px-[12px] py-[10px] text-left transition-colors duration-300 ${
        actif ? "border-accent/70" : "border-white/10"
      }`}
    >
      <span
        aria-hidden
        className="row-span-2 grid h-[30px] w-[30px] place-items-center rounded-[9px] border border-white/10 text-[13px] text-foreground-60"
      >
        {noeud.icone}
      </span>
      <span className="truncate text-[14px] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground">
        {noeud.titre}
      </span>
      <span className="truncate font-mono text-[10px] uppercase leading-[1.4] text-foreground-60">
        {noeud.detail}
      </span>
      {actif ? (
        <span className="absolute right-[10px] top-[8px] font-mono text-[9px] uppercase text-accent">{fait}</span>
      ) : null}
    </div>
  );
}

export function SchemaSection({ schema }: { schema: SchemaContent }) {
  const [mode, setMode] = useState(0);
  const [pas, setPas] = useState(0);
  const [visible, setVisible] = useState(false);
  const section = useRef<HTMLElement>(null);
  const plan = useRef<HTMLDivElement>(null);
  const coeur = useRef<HTMLDivElement>(null);
  const [liens, setLiens] = useState<string[]>([]);
  const m = schema.modes[mode] ?? schema.modes[0];

  useEffect(() => {
    const s = section.current;
    if (!s) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduit && window.matchMedia("(min-width: 1200px)").matches) s.dataset.vu = "0";
    const obs = new IntersectionObserver(([e]) => {
      const dedans = Boolean(e?.isIntersecting);
      setVisible(dedans);
      s.dataset.schema = dedans ? "" : "pause";
      if (dedans && s.dataset.vu === "0") s.dataset.vu = "1";
    }, { rootMargin: "0px 0px -15% 0px" });
    obs.observe(s);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setPas((p) => p + 1), PAS_MS);
    return () => window.clearInterval(id);
  }, [mode, visible]);

  useLayoutEffect(() => {
    const tracer = () => {
      const p = plan.current;
      const c = coeur.current;
      if (!p || !c) return;
      const rp = p.getBoundingClientRect();
      const rc = c.getBoundingClientRect();
      const cy = rc.top + rc.height / 2 - rp.top;
      const chemins: string[] = [];
      p.querySelectorAll<HTMLElement>("[data-colonne]").forEach((col) => {
        const droite = col.dataset.colonne === "sorties";
        col.querySelectorAll<HTMLElement>("[data-noeud]").forEach((n) => {
          const r = n.getBoundingClientRect();
          const y = r.top + r.height / 2 - rp.top;
          const x1 = droite ? rc.right - rp.left : r.right - rp.left;
          const x2 = droite ? r.left - rp.left : rc.left - rp.left;
          const ya = droite ? cy : y;
          const yb = droite ? y : cy;
          const d = (x2 - x1) / 2;
          chemins.push(`M${x1},${ya} C${x1 + d},${ya} ${x2 - d},${yb} ${x2},${yb}`);
        });
      });
      setLiens(chemins);
    };
    tracer();
    window.addEventListener("resize", tracer);
    return () => window.removeEventListener("resize", tracer);
  }, [mode]);

  if (!m) return null;
  const etape = pas % m.etapes.length;
  const sortie = pas % m.sorties.length;

  return (
    <section
      ref={section}
      data-section="schema"
      className="relative isolate bg-background py-[72px] tablet:py-[96px] desktop:pt-[104px] desktop:pb-[120px]"
    >
      <Grain opacity={0.1} className="z-0 hidden desktop:block" />
      <div className="relative mx-auto max-w-[1440px] px-[20px] tablet:px-[30px]">
        {/* Suite du fil parti du bas du héros : il descend sur la marge et
            tourne dans le trait du sur-titre. */}
        <span
          aria-hidden
          className="fil-suite fil-suite-fin pointer-events-none absolute left-[30px] top-[-104px] hidden h-[111px] w-px desktop:block"
        />
        <div className="schema-entree flex flex-col gap-[20px] desktop:flex-row desktop:items-end desktop:justify-between" style={delai(0)}>
          <div>
            <p className="m-0 font-mono text-[12px] uppercase text-accent desktop:flex desktop:items-center desktop:gap-[10px] desktop:leading-[14px] desktop:before:h-px desktop:before:w-[28px] desktop:before:bg-accent/60 desktop:before:content-['']">
              {schema.eyebrow}
            </p>
            <h2 className="m-0 mt-[10px] text-[clamp(34px,5vw,52px)] font-semibold leading-[1] tracking-[-0.05em] text-foreground">
              {schema.titre}
            </h2>
            <p className="m-0 mt-[12px] max-w-[46ch] text-[15px] leading-[1.45] text-foreground-60">{schema.texte}</p>
          </div>
          <div role="tablist" aria-label={schema.eyebrow} className="flex w-max gap-[4px] rounded-[14px] border border-white/10 p-[4px]">
            {schema.modes.map((x, i) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={i === mode}
                onClick={() => {
                  setMode(i);
                  setPas(0);
                }}
                className={`rounded-[10px] px-[14px] py-[9px] text-[12px] font-semibold uppercase tracking-[-0.01em] transition-colors duration-200 ${
                  i === mode ? "bg-accent text-accent-ink" : "text-foreground-60 hover:text-foreground"
                }`}
              >
                {x.onglet}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={plan}
          role="tabpanel"
          style={delai(140)}
          className="schema-entree relative mt-[24px] overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:22px_22px] p-[16px] tablet:p-[22px]"
        >
          <span aria-hidden className="hero-viseur pointer-events-none absolute inset-[10px] hidden desktop:block" />
          <svg aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full desktop:block">
            {liens.map((d) => (
              <path key={d} d={d} className="schema-lien" fill="none" stroke="currentColor" />
            ))}
          </svg>
          <div className="relative grid gap-[14px] desktop:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)] desktop:items-center desktop:gap-[72px]">
            <div data-colonne="entrees" className="grid gap-[10px]">
              {m.entrees.map((n, i) => (
                <Noeud key={n.titre} noeud={n} fait={schema.fait} ordre={i} />
              ))}
            </div>
            <div ref={coeur} style={delai(380)} className="schema-entree rounded-[18px] border border-accent/45 bg-surface-2 p-[16px]">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-semibold tracking-[-0.02em] text-foreground">{m.coeur}</span>
                <span className="flex items-center gap-[6px] font-mono text-[10px] uppercase text-accent">
                  <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-accent" />
                  {m.etat}
                </span>
              </div>
              <p className="m-0 mt-[12px] min-h-[40px] text-[14px] leading-[1.4] text-foreground">
                <span aria-hidden className="text-accent">→ </span>
                {m.actions[pas % m.actions.length]}
              </p>
              <div className="mt-[12px] grid grid-cols-4 gap-[6px]">
                {m.etapes.map((e, i) => (
                  <span
                    key={e}
                    className={`rounded-[8px] border py-[6px] text-center font-mono text-[9px] uppercase transition-colors duration-300 ${
                      i <= etape ? "border-accent text-accent" : "border-white/10 text-foreground-60"
                    }`}
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
            <div data-colonne="sorties" className="grid gap-[10px]">
              {m.sorties.map((n, i) => (
                <Noeud key={n.titre} noeud={n} actif={i === sortie} fait={schema.fait} ordre={i + 4} />
              ))}
            </div>
          </div>
          <div className="relative mt-[16px] flex flex-col gap-[6px] font-mono text-[10px] uppercase text-foreground-60 tablet:flex-row tablet:items-center tablet:justify-between">
            <span className="flex items-center gap-[6px]">
              <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-accent" />
              {m.journal}
            </span>
            <span className="flex gap-[16px]">
              {m.chiffres.map(([k, v]) => (
                <span key={k}>
                  {k} <b className="font-medium text-foreground">{v}</b>
                </span>
              ))}
              <span className="rounded-[6px] border border-white/15 px-[6px]">{schema.mention}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
