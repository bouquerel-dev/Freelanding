import type { ComponentProps } from "react";
import { HoverPrefetchLink } from "@/components/ui/HoverPrefetchLink";
import { SwapCopies } from "@/components/ui/SwapCopies";

/**
 * LE BOUTON D'APPEL DU SITE, un seul pour toutes les prises de contact.
 *
 * Forme (2026-11-27, demande d'Eliott) : une petite icône, puis le libellé,
 * sur un seul aplat. Plus de pastille contrastée dans le bouton : le contraste
 * interne se lisait comme deux boutons collés. L'icône dit l'action avant le
 * mot : téléphone pour un `tel:`, agenda pour une prise de rendez-vous, flèche
 * pour le reste (déduite de `href`, `icone` force un choix).
 *
 * Le libellé permute verticalement au survol (`SwapCopies`), l'icône avance
 * d'un cran ; à l'appui, le bouton se tasse à 97 %. Les règles de mouvement
 * vivent dans `interactions.css` (`.bouton-appel`).
 *
 * - `taille="compact"` : l'en-tête et les cartes (36 px, 40 dès la tablette).
 * - `taille="grand"` : le bouton d'une section ou d'une offre (48 px).
 * - `ton="volt"` : fond volt, encre. `ton="encre"` : fond sombre, icône volt,
 *   pour un bouton secondaire ou posé sur un aplat volt.
 *
 * `shortLabel` remplace le libellé sous 390 px de large. `largeur="pleine"`
 * étire le bouton ; `largeur="pleine-mobile"` ne l'étire que sous la tablette.
 */
export type BoutonAppelTaille = "compact" | "grand";
export type BoutonAppelTon = "volt" | "encre";
export type BoutonAppelLargeur = "contenu" | "pleine" | "pleine-mobile";
export type BoutonAppelIcone = "telephone" | "agenda" | "fleche";

const LARGEURS: Record<BoutonAppelLargeur, string> = {
  contenu: "w-fit",
  pleine: "w-full",
  "pleine-mobile": "w-full tablet:w-fit",
};

const TAILLES: Record<BoutonAppelTaille, string> = {
  compact: "h-[36px] gap-[8px] px-[12px] tablet:h-[40px] tablet:px-[14px]",
  grand: "h-[48px] gap-[10px] px-[20px]",
};

const TONS: Record<BoutonAppelTon, { bouton: string; texte: string; icone: string }> = {
  volt: { bouton: "bg-accent", texte: "text-accent-ink", icone: "text-accent-ink" },
  encre: { bouton: "bg-background shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]", texte: "text-foreground", icone: "text-accent" },
};

const TRACES: Record<BoutonAppelIcone, string> = {
  telephone:
    "M3.6 1.8h1.9l1 2.6-1.3.9a6.6 6.6 0 0 0 3.5 3.5l.9-1.3 2.6 1v1.9c0 .6-.5 1.1-1.1 1.1A10.6 10.6 0 0 1 2.5 2.9c0-.6.5-1.1 1.1-1.1Z",
  agenda: "M2.5 3.5h9v8h-9zM2.5 6h9M5 2v2.5M9 2v2.5",
  fleche: "M4 10 10 4M5.2 4H10v4.8",
};

export function iconePour(href: string): BoutonAppelIcone {
  if (href.startsWith("tel:")) return "telephone";
  if (href.startsWith("/rdv")) return "agenda";
  return "fleche";
}

export function BoutonAppel({
  href,
  label,
  shortLabel,
  taille = "compact",
  ton = "volt",
  largeur = "contenu",
  icone,
  className = "",
  ...rest
}: {
  href: string;
  label: string;
  shortLabel?: string;
  taille?: BoutonAppelTaille;
  ton?: BoutonAppelTon;
  largeur?: BoutonAppelLargeur;
  icone?: BoutonAppelIcone;
  className?: string;
} & Omit<ComponentProps<typeof HoverPrefetchLink>, "href" | "className" | "children">) {
  const c = TONS[ton];
  const forme = icone ?? iconePour(href);
  return (
    <HoverPrefetchLink
      data-part="bouton-appel"
      data-ton={ton}
      data-icone={forme}
      // Un bouton de rendez-vous compte comme CTA dans PostHog quel que soit
      // son ton : `GlobalAnalytics` ne reconnaît sinon que le fond volt.
      {...(forme === "agenda" ? { "data-cta": "true" } : {})}
      {...rest}
      href={href}
      className={`bouton-appel group relative flex flex-none flex-row items-center justify-center rounded-control no-underline outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${LARGEURS[largeur]} ${TAILLES[taille]} ${c.bouton} ${className}`.trim()}
    >
      <svg
        aria-hidden
        viewBox="0 0 14 14"
        width={taille === "grand" ? 16 : 14}
        height={taille === "grand" ? 16 : 14}
        fill="none"
        className={`bouton-appel-fleche flex-none ${c.icone}`}
      >
        <path d={TRACES[forme]} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="accent-room relative block translate-y-[0.46px] overflow-hidden">
        <SwapCopies
          travel={22}
          textClassName={`text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] ${c.texte}`}
        >
          {shortLabel ? (
            <>
              <span className="min-[390px]:hidden">{shortLabel}</span>
              <span className="hidden min-[390px]:inline">{label}</span>
            </>
          ) : (
            label
          )}
        </SwapCopies>
      </span>
    </HoverPrefetchLink>
  );
}
