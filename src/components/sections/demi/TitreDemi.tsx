import { LineReveal } from "@/components/motion/LineReveal";

/**
 * LE GRAND TITRE DES SECTIONS EN DEUX PARTIES (accueil, 2026-11-27) : capitales
 * serrées, une ligne par entrée de la donnée, chaque ligne qui monte de son
 * masque en cascade.
 *
 * DÉCLENCHEUR UNIQUE SUR LE `h2` (`LineReveal`) : un observateur posé sur
 * chaque ligne raisonnait sur sa boîte translatée sous le masque et, à 34 px
 * de corps, pouvait ne jamais la voir (revue motion du 2026-11-27).
 *
 * Le corps suit la colonne : la ligne la plus large mesurée (« votre projet. »)
 * fait 6,88 fois le corps en Geist. La police est en `font-display: optional` :
 * sa police de secours, plus large, doit tenir aussi. D'où la division par 7,6
 * de la largeur utile (moitié
 * de fenêtre moins marges et gouttière sur tablette et ordinateur, pleine
 * largeur sur mobile), plafonnée aux 92 px de la DA, et d'un masque qui ne
 * coupe qu'en hauteur (`overflow-y-clip`) : une lettre de trop déborde au
 * lieu d'être rognée.
 */
export function TitreDemi({
  lignes,
  encre,
}: {
  lignes: readonly string[];
  /** Classe de couleur du texte. */
  encre: string;
}) {
  return (
    <LineReveal
      as="h2"
      // Une ligne seule passe en texte : `LineReveal` ne rend un découpage
      // donné qu'à partir de deux lignes.
      {...(lignes.length > 1 ? { lines: [...lignes] } : { text: lignes[0] ?? "" })}
      delayStep={0.08}
      delay={0.05}
      className={`relative m-0 flex w-full flex-col p-0 text-left text-[clamp(34px,calc((calc(100vw/var(--zoom-ecran,1))-40px)/7.6),56px)] font-semibold uppercase leading-[0.82] tracking-[-0.05em] tablet:text-[min(68px,calc((calc(50vw/var(--zoom-ecran,1))-54px)/7.6))] desktop:text-[min(92px,calc((calc(50vw/var(--zoom-ecran,1))-60px)/7.6))] ${encre}`}
      lineClassName="w-full overflow-x-visible overflow-y-clip text-left leading-[0.82]"
    />
  );
}

/** Le petit libellé en tête de colonne, à 60 % de l'encre. */
export function EtiquetteDemi({ texte, encre }: { texte: string; encre: string }) {
  return (
    <p className={`m-0 text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] opacity-60 ${encre}`}>
      {texte}
    </p>
  );
}
