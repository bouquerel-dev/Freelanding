import Link from "next/link";
import { BoutonAppel } from "@/components/ui/BoutonAppel";
import { ImageProgressive } from "@/components/ui/ImageProgressive";
import { Icon } from "@/components/ui";
import { Reveal } from "@/components/motion/Reveal";
import { Ouverture } from "@/components/motion/Ouverture";
import { TitreDemi } from "@/components/sections/demi/TitreDemi";
import { formatShortDate } from "@/components/format-date";
import type { ArticlesSection as ArticlesContenu, BlogPost } from "@/lib/content/types";

/**
 * « ACTUALITÉS ET NOUVEAUTÉS » DE L'ACCUEIL, sur l'aplat volt (2026-11-27,
 * demande d'Eliott : alternance volt / blanc, sections en deux parties).
 *
 * La grille de quatre cartes posait une carte sur deux avec son visuel réduit à
 * une pastille de 50 px, qui se lisait comme un rond noir vide. Ici, une liste :
 * le titre et le lien vers le blog à gauche, les quatre derniers articles à
 * droite, chacun avec sa vignette, sa date et son titre en entier. Le fond
 * s'ouvre depuis le blanc de la FAQ (`Ouverture`).
 *
 * `/a-propos` garde la grille (`ArticlesSection`).
 */

const ENCRE = "text-accent-ink";

function LigneArticle({ post, index }: { post: BlogPost; index: number }) {
  return (
    <Reveal
      as="li"
      className="border-t border-accent-ink/20"
      initialOpacity={0.001}
      initialY={16}
      duration={0.7}
      delay={0.08 * index}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group grid grid-cols-[88px_1fr] items-center gap-[16px] py-[18px] no-underline tablet:grid-cols-[120px_1fr_auto] tablet:gap-[24px] tablet:py-[22px]"
      >
        <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-control bg-accent-ink">
          <ImageProgressive
            src={post.cover.src}
            alt=""
            width={240}
            height={180}
            className="block h-full w-full object-cover object-center transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        </span>
        <span className="flex flex-col gap-[8px]">
          <time dateTime={post.date} className={`text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] opacity-70 ${ENCRE}`}>
            {formatShortDate(post.date)}
          </time>
          <span className={`text-[18px] font-semibold leading-[1.15] tracking-[-0.02em] [text-wrap:balance] tablet:text-[22px] ${ENCRE}`}>
            {post.title}
          </span>
        </span>
        <Icon
          name="arrow-up-right"
          size={22}
          className={`hidden shrink-0 transition-transform duration-200 ease-out group-hover:-translate-y-[2px] group-hover:translate-x-[2px] motion-reduce:transition-none tablet:block ${ENCRE}`}
        />
      </Link>
    </Reveal>
  );
}

export function ActualitesSection({
  posts,
  articles,
  autour,
}: {
  posts: BlogPost[];
  articles: ArticlesContenu;
  /** Couleur de la section précédente, d'où s'ouvre l'aplat. */
  autour: string;
}) {
  const lignes = articles.titleLines ?? [articles.eyebrow ?? ""];
  return (
    <section
      data-section="articles"
      className="relative flex w-full flex-col items-center overflow-hidden px-[20px] py-[72px] [font-family:var(--font-sans)] tablet:px-[24px] tablet:py-[130px] desktop:px-[30px] desktop:py-[160px]"
    >
      <Ouverture fond="bg-accent" autour={autour} filet="bg-accent-ink/20" />
      <div className="relative z-[1] grid w-full max-w-[1440px] grid-cols-1 gap-[40px] tablet:grid-cols-2 tablet:gap-0">
        <div className="relative tablet:pr-[30px]">
          <div className="flex flex-col items-start gap-[24px] tablet:sticky tablet:top-[120px] tablet:gap-[36px]">
            <TitreDemi lignes={lignes} encre={ENCRE} />
            {articles.cta ? (
              <BoutonAppel href={articles.cta.href} label={articles.cta.label} ton="encre" taille="grand" icone="fleche" />
            ) : null}
          </div>
        </div>
        <div className="tablet:pl-[30px] desktop:pl-[60px]">
          <ol className="m-0 flex list-none flex-col border-b border-accent-ink/20 p-0">
            {posts.slice(0, 4).map((post, i) => (
              <LigneArticle key={post.slug} post={post} index={i} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
