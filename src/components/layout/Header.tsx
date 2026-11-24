import type { ReactNode } from "react";
// Préchargement AU SURVOL : l'en-tête est visible sur toutes les pages, ses
// liens classiques téléchargeaient `/contact` et les autres routes dès l'arrivée.
import { HoverPrefetchLink as Link } from "@/components/ui/HoverPrefetchLink";
import { Reveal } from "@/components/motion/Reveal";
import { BoutonAppel } from "@/components/ui/BoutonAppel";
import { uiLabels } from "@/content/ui";
import type { SiteConfig } from "@/lib/content/types";
import { Logo } from "./Logo";

/**
 * Header — reconstruction fidèle du header Framer de la page d'accueil d'origine
 * (`header.ts`, variantes Desktop / Tablet / Phone fusionnées en un composant
 * responsive). Chrome exact du live :
 *   - Overlay TRANSPARENT positionné en absolu au-dessus du hero (pas de fond,
 *     pas de bordure, pas de blur). Container `framer-1nqx0rw` : z-9, top:0,
 *     inset-x:0 ; padding 30px (≥1200) / 20px (mobile), sans padding bas.
 *   - Gauche : le logo seul (baseline et séparateur retirés le 2026-11-24).
 *   - Droite `framer-beg1hm` (gap 28→36px) : nav "ACCUEIL / RÉALISATIONS / À PROPOS / CONTACT" (Blog retiré le 2026-11-24)
 *     (séparateurs "/" opacity .2) visible dès 810px, puis le CTA
 *     « Réserver un appel » (toujours visible), le `BoutonAppel` partagé.
 *
 * Reveal d'apparition (appear-id `1nqx0rw`) : opacity .001 + translateY(-100px)
 * + scale(1.3) → état final, tween 1.4s delay .3s ease cubic(0.68,0,0,1). Joué
 * via `@/components/motion/Reveal` avec le déclencheur `"appear"` : l'état
 * masqué est rendu dès le HTML serveur et l'entrée part au montage, exactement
 * comme la source démarre ses `appear effects`. Sans JavaScript, la feuille
 * `<noscript>` du layout remet l'élément à l'état visible.
 *
 * Fidélité mobile (VÉRIFIÉ contre archive ET live, headers Phone byte-identiques,
 * 3407 chars) : la variante « Phone » du header source contient UNIQUEMENT le Logo
 * (« la marque d'origine ») + le bouton orange « START A PROJECT ». PAS de burger, PAS de menu
 * hamburger. Le `Container framer-12ut4h8` (« 1 »/« 2 ») n'est pas un burger : ce
 * sont les 2 copies du libellé « START A PROJECT » pour le swap vertical au survol.
 * Sur mobile, la nav (Accueil/Réalisations/À propos/Contact) n'est donc accessible que via le
 * footer et via le menu flottant séparé, invisible en haut puis affiché au scroll.
 */

export function Header({
  site,
  appear = false,
}: {
  site: SiteConfig;
  /**
   * Joue l'entrée `scale(1.3)` + `translateY(-100)` du header. RÉSERVÉ À LA HOME.
   *
   * MESURÉ, source contre clone. Dans le miroir, seule `/` enveloppe le header
   * dans `framer-1nqx0rw-container` porteur de
   * `data-framer-appear-id="1nqx0rw"` ; `/contact`, `/about`, `/work`, `/blog`
   * et les deux pages légales le posent dans `framer-2be8m-container`, SANS
   * appear-id. Vérifié au runtime, pas seulement dans le SSR : relevé en rAF sur
   * les 3 premières secondes du live, le conteneur de `/contact` reste
   * `transform: none`, `opacity: 1` sur ses 219 images, tandis que celui de `/`
   * part de `matrix(1.3,…,-100)` à 55 ms et arrive à l'identité vers 1,85 s.
   *
   * Chez nous l'entrée était jouée sur les 18 pages : le header s'affichait, puis
   * RETOMBAIT à `opacity 0.001` / `scale(1.3)` à 224 ms (à l'hydratation) avant
   * de rejouer son entrée jusqu'à 2 s. Un clignotement, plus une animation
   * inventée, sur 17 routes.
   */
  appear?: boolean;
}) {
  const { brand, nav, primaryCta } = site;

  // Base commune aux liens ET aux séparateurs « / ».
  const navBaseCls =
    "relative whitespace-pre text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground no-underline";
  // Survol des LIENS (2026-11-24) : le libellé permute vers sa copie volt et
  // un trait se dessine dessous, règles `.nav-lien*` de `interactions.css`.
  // Les séparateurs gardent la base, sans état de survol.
  const navItemCls = `${navBaseCls} nav-lien block`;

  // Au-delà de 1500 px, le logo et le menu se calent sur la colonne de 1440
  // du contenu au lieu des bords de la fenêtre (2026-10-16) : sur grand
  // écran, ils flottaient à 240 px du texte qu'ils encadrent.
  const shellCls =
    "absolute inset-x-0 top-0 z-[9] flex flex-row items-center justify-between gap-[10px] px-[20px] pt-[20px] tablet:px-[30px] tablet:pt-[30px] desktop:px-[max(30px,calc((100%-1440px)/2+30px))]";

  const contenu: ReactNode = (
    <>
      {/* Le logo seul : la baseline et son séparateur sont partis le
          2026-11-24 (demande d'Eliott), le héros dit déjà ce qu'il fait. */}
      <div className="relative flex flex-none flex-row items-center text-foreground">
        <Logo brand={brand} />
      </div>

      {/* framer-beg1hm : Nav (gap 28→36px) */}
      <div className="relative flex w-min flex-none flex-row items-center justify-start gap-[10px] overflow-visible tablet:gap-[28px] desktop:gap-[36px]">
        {/* framer-16rltc5 : menu — visible dès 810px (gap 20→24px) */}
        <nav
          aria-label={uiLabels.chrome.mainNavLabel}
          className="relative hidden w-min flex-none flex-row items-center justify-end gap-[20px] overflow-visible tablet:flex desktop:gap-[24px]"
        >
          {nav.map((link, index) => (
            <span key={link.href} className="contents">
              {index > 0 ? (
                <span aria-hidden className={`${navBaseCls} opacity-20`}>
                  {uiLabels.chrome.navSeparator}
                </span>
              ) : null}
              <Link
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className={navItemCls}
              >
                <span className="nav-lien-masque accent-room">
                  <span className="nav-lien-texte">{link.label}</span>
                  <span aria-hidden className="nav-lien-copie">
                    {link.label}
                  </span>
                </span>
                <span aria-hidden className="nav-lien-trait" />
              </Link>
            </span>
          ))}
        </nav>

        {/* CTA, toujours visible */}
        <BoutonAppel
          href={primaryCta.href}
          label={primaryCta.label}
          shortLabel={primaryCta.shortLabel}
        />
      </div>
    </>
  );

  // Hors home, le header est un simple `<header>` : ni motion, ni remount, donc
  // aucun retour à l'état masqué à l'hydratation (cf. la prop `appear`).
  if (!appear) return <header className={shellCls}>{contenu}</header>;

  return (
    <Reveal
      as="header"
      // `appear effect` de la source, démarré dès la première peinture sans
      // observateur. `appearId` = la clé de l'entrée dans son bloc
      // `__framer__appearAnimationsContent`.
      trigger="appear"
      appearId="1nqx0rw"
      className={shellCls}
      initialOpacity={0.001}
      initialY={-100}
      initialScale={1.3}
      duration={1.4}
      delay={0.3}
    >
      {contenu}
    </Reveal>
  );
}
