import type { ComponentProps } from "react";
import { HoverPrefetchLink } from "@/components/ui/HoverPrefetchLink";
import { SwapCopies } from "@/components/ui/SwapCopies";

/**
 * LE BOUTON D'APPEL DU SITE, un seul pour toutes les prises de rendez-vous
 * (2026-11-24, demande d'Eliott : tous les boutons d'appel s'alignent sur celui
 * de l'en-tête, avec son petit logo).
 *
 * Forme : rayon `rounded-control`, libellé en capitales qui permute
 * verticalement au survol (`SwapCopies`), et une pastille au rayon
 * concentrique (`rounded-tag`) qui porte la flèche. Au survol, le fond
 * s'éclaircit à peine et la flèche avance d'un cran ; à l'appui, le bouton se
 * tasse à 97 %. Les règles de mouvement vivent dans `interactions.css`
 * (`.bouton-appel`), gardées derrière `(hover: hover) and (pointer: fine)` et
 * coupées en mouvement réduit.
 *
 * - `taille="compact"` : l'en-tête et les cartes (36 px, 40 dès la tablette).
 * - `taille="grand"` : le bouton d'une section ou d'une offre (48 px).
 * - `ton="volt"` : fond volt, pastille encre. `ton="encre"` : l'inverse, pour
 *   un bouton posé sur un aplat volt où le volt se fondrait.
 *
 * Le `translate-y-[0.46px]` centre l'encre des capitales, pas la boîte de
 * ligne ; `.accent-room` laisse la place à l'accent du « É » sans décaler le
 * texte. `shortLabel` remplace le libellé sous 390 px de large.
 * `largeur="pleine"` étire le bouton (libellé à gauche, pastille à droite) ;
 * `largeur="pleine-mobile"` ne l'étire que sous la tablette.
 */
export type BoutonAppelTaille = "compact" | "grand";
export type BoutonAppelTon = "volt" | "encre";
export type BoutonAppelLargeur = "contenu" | "pleine" | "pleine-mobile";

const LARGEURS: Record<BoutonAppelLargeur, string> = {
  contenu: "w-fit",
  pleine: "w-full",
  "pleine-mobile": "w-full tablet:w-fit",
};

const TAILLES: Record<BoutonAppelTaille, { bouton: string; pastille: string }> = {
  compact: {
    bouton: "h-[36px] gap-[10px] pl-[12px] pr-[4px] tablet:h-[40px] tablet:pl-[16px] tablet:pr-[5px]",
    pastille: "size-[28px] tablet:size-[30px]",
  },
  grand: {
    bouton: "h-[48px] gap-[14px] pl-[20px] pr-[6px]",
    pastille: "size-[36px]",
  },
};

const TONS: Record<BoutonAppelTon, { bouton: string; texte: string; pastille: string }> = {
  volt: { bouton: "bg-accent", texte: "text-accent-ink", pastille: "bg-accent-ink text-accent" },
  encre: { bouton: "bg-background shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]", texte: "text-foreground", pastille: "bg-accent text-accent-ink" },
};

export function BoutonAppel({
  href,
  label,
  shortLabel,
  taille = "compact",
  ton = "volt",
  largeur = "contenu",
  className = "",
  ...rest
}: {
  href: string;
  label: string;
  shortLabel?: string;
  taille?: BoutonAppelTaille;
  ton?: BoutonAppelTon;
  largeur?: BoutonAppelLargeur;
  className?: string;
} & Omit<ComponentProps<typeof HoverPrefetchLink>, "href" | "className" | "children">) {
  const t = TAILLES[taille];
  const c = TONS[ton];
  return (
    <HoverPrefetchLink
      data-part="bouton-appel"
      data-ton={ton}
      {...rest}
      href={href}
      className={`bouton-appel group relative flex flex-none flex-row items-center justify-between rounded-control no-underline outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${LARGEURS[largeur]} ${t.bouton} ${c.bouton} ${className}`.trim()}
    >
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
      <span
        aria-hidden
        className={`grid flex-none place-items-center overflow-hidden rounded-tag ${t.pastille} ${c.pastille}`}
      >
        <svg viewBox="0 0 12 12" width="12" height="12" fill="none" className="bouton-appel-fleche">
          <path d="M3 9 9 3M4.2 3H9v4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </HoverPrefetchLink>
  );
}
