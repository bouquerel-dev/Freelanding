# DESIGN — eliottbouquerel.fr

Direction : dark premium, éditorial, coins arrondis, typo dominante. Extrait fidèle du site d'origine.

## Couleurs (tokens = `globals.css`)
- `background` `#0b0b0b` · `foreground` `#ffffff` · `accent` `#ff4500` (unique, CTA/highlights) · `muted` `#e9e9e9`
- Surfaces : `surface-1 #0e0e0e`, `surface-2 #181818`
- `border` `rgba(255,255,255,.1)` (hairline) · `text-secondary` `#999`
- Accents secondaires (`#0099ff`, `#d2ff37`…) = portés par le contenu (vignettes projet), pas des tokens globaux.

## Typo
- Sans : Geist (400/500/600/700/900). Mono : Geist Mono.
- Titres héros : Geist Black, `line-height:0.82`, `letter-spacing:-0.05/-0.07em`.
- Échelle : 11·12·14·16·18·22·26·32·44·52·68·92·100.

## Formes / espace
- Radius (tokens `globals.css`, utilitaires `rounded-*`) : `control` 12px boutons et champs · `card` 20px cartes, encadrés, panneaux, médias cadrés, menus, modales, bandeau cookies · `panel` 24px grands panneaux (carte du formulaire de contact) · `tag` 8px étiquettes et badges · `pill` 50px pilules · `full` ronds. `none` (0) seulement pour les filets 1px et les fonds de section bord à bord. Un média dans un cadre arrondi : `overflow-hidden` sur le cadre (ou `rounded-[inherit]` sur un pseudo-élément de bord).
- Spacing dominant : 10 / 20 / 30. Conteneur padding X : 20–24.

## Motion
- Smooth scroll (Lenis), grain overlay, reveals au scroll (GSAP ScrollTrigger), transitions/hover (Motion), counters. `prefers-reduced-motion` respecté.

## Responsive
- Breakpoints min-width : tablet 810, desktop 1200.

## Règle d'or
Fidélité au rendu de référence (`localhost:8080`) validée section par section. Anti-slop : pas d'Inter "premium", pas d'AI-purple, pas de center-bias par défaut, respect de la densité et de la variance d'origine.
