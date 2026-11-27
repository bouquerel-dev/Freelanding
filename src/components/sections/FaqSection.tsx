"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { FaqItem } from "@/lib/content/types";
import { homeContent } from "@/content/home";
import { Reveal } from "@/components/motion/Reveal";
import { SwapCopies } from "@/components/ui/SwapCopies";
import { ToggleIcon } from "@/components/ui/ToggleIcon";
import { toggleFaqItem } from "./faq-state";
import { Ouverture } from "@/components/motion/Ouverture";
import { EtiquetteDemi, TitreDemi } from "@/components/sections/demi/TitreDemi";

/**
 * FaqSection — reconstruction fidèle (CSS Framer → Tailwind responsive) de la
 * section "Before we get started." (section08, `framer-leitka`) de la home
 * le gabarit d'origine, avec ACCORDÉON fonctionnel.
 *
 * Sources : markup content/framer-html/section08.ts, styles framer-global.css
 * (classes `.framer-leitka`, `.framer-Nzf4w` = item, presets `wwtw0z`/`11kvajf`/
 * `1r5vzwr`). Valeurs géométriques + couleurs vérifiées au rendu réel (miroir
 * offline de le-site-d-origine) aux largeurs 390 / 810 / 1440.
 *
 * Section CLAIRE (inverse du thème sombre) : fond `#e9e9e9` (--muted), texte
 * `#0b0b0b` (--background). Tokens de couleur exprimés en valeurs exactes quand
 * l'échelle Tailwind ne les expose pas (rgba(11,11,11,·)).
 *
 * Breakpoints (Framer desktop-first → Tailwind mobile-first, INVERSÉ) :
 *   base = mobile "Phone" (≤809.98) · tablet: ≥810 "Tablet" · desktop: ≥1200 "Desktop".
 *
 * Layout Framer (identique aux 3 breakpoints, seules les tailles varient) :
 *   Container (1sm0lew, flex col) = deux rangées PLEINE LARGEUR empilées :
 *     · evxos    → bloc titre : ro3v3f (50% à gauche desktop/tablet ; pleine
 *                  largeur en mobile) avec FAQ + h2 alignés à droite.
 *     · 17aidnj  → bloc accordéon : 1xmkit9 (50% à droite desktop/tablet ; pleine
 *                  largeur en mobile), justifié à droite.
 *   Le titre étant très haut et l'accordéon commençant plus bas, ils s'imbriquent
 *   visuellement (titre à gauche, accordéon à droite) séparés par le filet central.
 *
 * Accordéon (état par défaut = item 01 ouvert, comme la source "Desktop open") :
 *   - Chaque item s'ouvre indépendamment ; re-cliquer ferme uniquement cet item.
 *   - Ouverture/fermeture animées en hauteur via `motion` (robuste, height:auto).
 *   - Icône : `@/components/ui/ToggleIcon`, source unique du plus/moins des
 *     accordéons. La bascule n'est pas un simple échange de barres : le relevé
 *     image par image de la source est documenté dans ce composant.
 *   - Numéro (01…04) : visible en ligne quand FERMÉ ; en OUVERT il passe en absolu
 *     (left:-18px) et se retrouve masqué par l'overflow — fidèle à la source, où
 *     l'item ouvert n'affiche pas son numéro et la question glisse à gauche.
 *
 * Reveals ROBUSTES (repos = état final visible) via `@/components/motion/Reveal`.
 * Les timings d'entrée sont volontairement sobres : le câblage fin des animations
 * d'apparition Framer relève du lot animations (état final rendu d'abord).
 *
 * Réutilisable /contact (même bloc FAQ, données ContactContent.faq).
 */

// Stack de police littérale (identique au reste du port).
const FONT = "[font-family:var(--font-sans)]";

// Couleurs exactes de la section (light) — l'échelle Tailwind n'expose pas
// `--background-60`, on écrit donc les valeurs rgba littérales.
const INK = "#0b0b0b"; // --background
const INK_75 = "rgba(11,11,11,0.75)"; // texte des réponses
const RULE_12 = "rgba(11,11,11,0.12)"; // filet sous chaque item
const BAR = "rgba(11,11,11,0.6)"; // barres de l'icône

function FaqRow({
  index,
  item,
  open,
  onToggle,
}: {
  index: number;
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const number = String(index + 1).padStart(2, "0");
  const headerId = `faq-h-${index}`;
  const panelId = `faq-p-${index}`;
  return (
    // framer-Nzf4w (item) : flex col, overflow clip, pb 30(open)/20(close)
    <Reveal
      className="w-full"
      initialOpacity={0.001}
      initialY={12}
      transition={{ type: "tween", duration: 0.6, delay: 0.05 + index * 0.08 }}
    >
      {/* pb-[20px] constant : le delta open/close (14px + réponse + 10px) vit
          dans le conteneur animé → total sous la réponse = 10 + 20 = 30px (open),
          sous la question = 20px (close). */}
      <div className="relative flex w-full flex-col items-start overflow-hidden pb-[20px]">
        {/* framer-1i9d3kt : header (row), pt 20px + gap 10px */}
        <button
          type="button"
          id={headerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="relative flex w-full cursor-pointer items-center gap-[10px] overflow-hidden pt-[20px] pb-0 text-left"
        >
          {/* framer-6rdjy8 : numéro + question (overflow clip → masque le n° absolu en open) */}
          <span className="relative flex w-px flex-[1_0_0] items-center gap-[10px] overflow-hidden">
            {/* framer-1uwy4qo : numéro — inline (fermé) / absolu left:-18px (ouvert, masqué) */}
            <span
              aria-hidden
              className="relative w-[32px] shrink-0 whitespace-pre text-[12px] font-medium tabular-nums leading-[1.2] tracking-[-0.01em] opacity-60"
              style={{ color: INK }}
            >
              {number}
            </span>
            {/* framer-1nopks0 : question (11px, 60% noir, uppercase) */}
            <span
              className="w-px flex-[1_0_0] whitespace-pre-wrap break-words text-[18px] font-semibold leading-[1.2] tracking-[-0.02em] desktop:text-[20px]"
              style={{ color: INK }}
            >
              {item.question}
            </span>
          </span>
          <ToggleIcon open={open} color={BAR} />
        </button>

        {/* framer-l2hjvx : réponse — hauteur animée (0 ↔ auto). Le delta open/close
            (gap 14px + réponse + 10px) est intégralement dans ce conteneur animé. */}
        <motion.div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.3, ease: [0.68, 0, 0, 1] }
          }
          className="w-full overflow-hidden"
        >
          {/* NON RÉSOLU (mesuré, pas deviné). Le CSS de la source donne
              `padding: 20px 0 14px` sur l'en-tête et rien sur ce panneau, mais
              l'appliquer tel quel DÉGRADE : mesuré en relatif à la première
              question, on passe d'un écart de 14px sur la seule réponse de
              l'item 2 à un écart uniforme de 24px sur tous les repères. Les
              hauteurs de panneau, elles, sont exactes dans les deux cas
              (86px en 390, 72px en 1440). Il reste 24px non localisés dans le
              PREMIER item. On garde donc l'état le moins faux en attendant. */}
          <div className="relative flex w-full items-start pt-[12px] pb-[10px] pl-[42px]">
            {/* framer-1gacui7 : texte de réponse (18px mobile/tablet, 20px desktop) */}
            <p
              className="w-px max-w-[600px] flex-[1_0_0] whitespace-pre-wrap break-words text-[16px] font-medium leading-[1.45] tracking-[-0.01em] desktop:text-[17px]"
              style={{ color: INK_75 }}
            >
              {item.answer}
            </p>
          </div>
        </motion.div>

        {/* framer-zrzv8j : filet bas (12% noir) */}
        <span
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ backgroundColor: RULE_12 }}
        />
      </div>
    </Reveal>
  );
}

/**
 * Habillage de la section (surtitre, titre en deux lignes, bouton). Il était
 * recopié EN DUR et EN ANGLAIS dans le JSX, alors que `homeContent.faqSection`
 * le porte déjà traduit : le défaut vient donc de la donnée. Les six pages qui
 * montent cette section (accueil, contact, blog, projets, mentions légales,
 * 404) partagent le même habillage sur la source, seul le tableau `faq` change.
 *
 * L'import est DIRECT (`@/content/home`) et non passé en prop : ce composant est
 * client, et aucun de ses six appelants n'est dans le périmètre de ce lot. Les
 * props restent ouvertes pour qu'un appelant puisse les fournir plus tard.
 */
export function FaqSection({
  faq,
  eyebrow = homeContent.faqSection?.eyebrow ?? "",
  titleLines = homeContent.faqSection?.titleLines ?? [],
  cta = homeContent.faqSection?.cta,
  topAccent = true,
  fond = "bg-muted",
  autour,
}: {
  faq: FaqItem[];
  eyebrow?: string;
  titleLines?: readonly string[];
  cta?: { label: string; href: string };
  topAccent?: boolean;
  /** Classe de fond de la section (gris par défaut, papier sur l'accueil). */
  fond?: string;
  /**
   * Couleur de la section précédente : le fond s'ouvre alors depuis elle au
   * défilement (`Ouverture`). Sans elle, le fond est posé d'un bloc.
   */
  autour?: string;
}) {
  // Première question ouverte par défaut : c'est celle qu'on vient chercher.
  const [openItems, setOpenItems] = useState<Set<number>>(() => new Set([0]));

  /*
   * EN DEUX PARTIES, CÔTE À CÔTE (2026-11-27, demande d'Eliott) : le titre
   * occupe la moitié gauche et reste épinglé pendant qu'on lit les questions à
   * droite. Avant, le titre aligné à droite surmontait une liste décalée d'un
   * cran, ce qui laissait un grand vide en bas à gauche.
   */
  return (
    <section
      data-section="faq"
      className={
        FONT +
        " relative flex w-full flex-col items-center justify-start overflow-visible " +
        (autour ? "" : fond + " ") +
        "px-[20px] py-[56px] tablet:px-[24px] tablet:py-[120px] desktop:px-[30px] desktop:py-[150px]"
      }
    >
      {autour ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <Ouverture fond={fond} autour={autour} filet="bg-background/10" />
        </div>
      ) : (
        <div
          className="absolute left-[calc(50%-0.5px)] top-0 z-[1] hidden h-full w-px opacity-[0.08] tablet:block"
          style={{ backgroundColor: INK }}
        />
      )}
      {/* Languette qui prolonge la section précédente sur la moitié droite. */}
      {topAccent && !autour ? (
        <div className={`absolute right-0 top-[-20px] z-[2] h-[22px] w-1/2 overflow-hidden tablet:top-[-30px] tablet:h-[32px] ${fond}`} />
      ) : null}

      <div className="relative z-[2] grid w-full max-w-[1440px] grid-cols-1 gap-[36px] tablet:grid-cols-2 tablet:gap-0">
        <div className="relative tablet:pr-[30px]">
          <div className="flex flex-col gap-[24px] tablet:sticky tablet:top-[120px] tablet:gap-[36px]">
            {eyebrow ? <EtiquetteDemi texte={eyebrow} encre="text-background" /> : null}
            <TitreDemi lignes={titleLines} encre="text-background" />
          </div>
        </div>

        <div className="flex flex-col items-start gap-[28px] tablet:gap-[40px] tablet:pl-[30px] desktop:pl-[60px]">
          <div className="relative flex w-full flex-col items-start overflow-hidden">
            {faq.map((item, i) => (
              <FaqRow
                key={item.question}
                index={i}
                item={item}
                open={openItems.has(i)}
                onToggle={() => setOpenItems((current) => toggleFaqItem(current, i))}
              />
            ))}
          </div>
          {cta ? (
            <a
              href={cta.href}
              className="surface-dark group relative flex h-[44px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-control px-[16px] no-underline tablet:w-fit"
              style={{ backgroundColor: INK }}
            >
              {/* Libellé qui permute vers le haut au survol, comme le CTA de l'en-tête. */}
              <span className="relative block h-[14.4px] overflow-hidden">
                <SwapCopies
                  travel={22}
                  textClassName="whitespace-pre text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-foreground"
                >
                  {cta.label}
                </SwapCopies>
              </span>
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
