/* Le pied de page est sur toutes les routes : ses liens préchargeaient tout le
   site dès qu'on descendait jusqu'à lui. Voir `HoverPrefetchLink`. */
import { HoverPrefetchLink } from "@/components/ui/HoverPrefetchLink";
import { ConsentPreferencesLink } from "@/components/consent/ConsentPreferencesLink";
import { content } from "@/lib/content";
import { Reveal } from "@/components/motion/Reveal";
import { Grain } from "@/components/effects/Grain";
import { SocialGlyph } from "@/components/layout/SocialGlyph";
import { TitreDemi } from "@/components/sections/demi/TitreDemi";
import { BoutonAppel } from "@/components/ui/BoutonAppel";
import type { Link } from "@/lib/content/types";
import { uiLabels } from "@/content/ui";
import { Logo } from "./Logo";
// Le formulaire est un composant CLIENT ; le pied de page reste serveur.
import { FooterContactForm } from "./FooterContactForm";
import { Suspense } from "react";
import { FooterContact } from "./FooterContact";
import { FooterContactAvecSujet } from "./FooterContactAvecSujet";
import { ReservationAvecSujet } from "@/components/rendez-vous/ReservationAvecSujet";
import { ReservationRendezVous } from "@/components/rendez-vous/ReservationRendezVous";
import { rendezVousContent } from "@/content/rendez-vous";
import type { IdRendezVous } from "@/content/rendez-vous";
import { resoudreConfiguration, typesVisibles } from "@/lib/rendez-vous/config";

/**
 * PIED DE PAGE, CONDENSÉ LE 2026-11-27 (demande d'Eliott : « condenser un peu
 * le footer », remplacer « Montrez-moi ce qui vous bloque » par quelque chose
 * de simple, en deux parties, avec le formulaire, le créneau et le contact).
 *
 * Deux étages au lieu de trois :
 *  1. le contact en deux moitiés. À gauche, le titre, une phrase, le
 *     téléphone, l'adresse e-mail, la zone et le délai de réponse. À droite,
 *     le formulaire (créneau ou message). La carte photo est partie : le
 *     visage d'Eliott est déjà dans le héros de l'accueil.
 *  2. une seule bande de liens : logo, navigation, pages légales, réseaux,
 *     copyright. « Accueil » a quitté la navigation (le logo y mène).
 *
 * Fond sombre conservé : après l'aplat volt des actualités, la page se ferme
 * sur une cassure noire.
 *
 * Données : `content.getSiteConfig()`, aucun texte éditorial en dur.
 */

const FONT = "[font-family:var(--font-sans)]";

/** Ce qui précède et ce qui suit le fragment mis en avant ; sans fragment, tout est avant. */
export function decouperAutour(texte: string, fragment: string): readonly string[] {
  return fragment ? texte.split(fragment) : [texte];
}

/**
 * Icône sociale. LE GLYPHE EST INLINE ET HÉRITE DE `text-foreground` : servi
 * par une balise `<img>`, son `currentColor` retombait sur le noir et le glyphe
 * GitHub disparaissait sur ce fond presque noir.
 */
function SocialIcon({ social }: { social: Link }) {
  return (
    <a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${uiLabels.chrome.socialLinkPrefix}${social.label}`}
      className="group relative flex aspect-square h-[20px] w-[20px] flex-none items-center justify-center text-foreground"
    >
      <SocialGlyph
        social={social}
        className="block h-full w-full opacity-50 transition-opacity duration-300 ease-out group-hover:opacity-90 motion-reduce:transition-none"
      />
    </a>
  );
}

export async function Footer({
  sujetRendezVous,
  sansFormulaire = false,
}: {
  /**
   * Sujet de rendez-vous de la page (pages de prestation) : présélectionné
   * dans l'onglet rendez-vous, sans lecture de `?sujet=`.
   */
  sujetRendezVous?: IdRendezVous;
  /**
   * Pied de page sans le formulaire (message ou rendez-vous) : la page `/rdv`
   * porte déjà le formulaire de rendez-vous, deux exemplaires se concurrencent.
   */
  sansFormulaire?: boolean;
} = {}) {
  const {
    brand,
    footerNav = [],
    contact,
    footerForm: footerFormSite,
    socials,
    legalLinks,
    copyrightLong,
    footerCta,
  } = await content.getSiteConfig();

  const footerForm = sansFormulaire ? undefined : footerFormSite;
  // Mêmes types de rendez-vous que la section de `/contact` : ceux dont
  // le cockpit est configuré (`RDV_TOKEN`). Aucun = pas d'onglet rendez-vous.
  const { typesDisponibles } = resoudreConfiguration();
  const typesRendezVous = rendezVousContent.types.filter((type) =>
    typesDisponibles.includes(type.id),
  );

  // Sous-texte : le fragment mis en avant (donnée `subtextEmphasis`) passe en
  // blanc plein, le reste à 60 %.
  const subtext = footerCta?.subtext ?? "";
  const subtextEmphasis = footerCta?.subtextEmphasis?.[0] ?? "";
  const [subtextBefore, subtextAfter] = decouperAutour(subtext, subtextEmphasis);
  const titre = footerCta?.headingLines ?? (footerCta?.heading ? [footerCta.heading] : []);

  const inlineLinkCls =
    "text-foreground no-underline transition-colors duration-200 hover:text-accent";
  const petitLienCls =
    "text-foreground-60 no-underline transition-colors duration-200 hover:text-foreground motion-reduce:transition-none";

  const formulaireMessage = footerForm ? (
    <FooterContactForm
      footerForm={footerForm}
      emailContact={contact.email}
      inlineLinkCls={inlineLinkCls}
    />
  ) : null;

  return (
    <>
      {/* ANCRE DES BOUTONS « RÉSERVER » : le pied de page porte le seul
          formulaire du site (message ou rendez-vous). Les liens `#rendez-vous`
          y mènent, et `FooterContact` ouvre alors l'onglet rendez-vous. */}
      <div id="rendez-vous" aria-hidden />
      <Reveal
        as="footer"
        className={
          FONT +
          " relative flex w-full flex-col items-center justify-start overflow-clip bg-background " +
          "px-[20px] pt-[64px] pb-[24px] tablet:px-[24px] tablet:pt-[120px] tablet:pb-[36px] desktop:px-[30px]"
        }
        initialOpacity={0.001}
        initialY={16}
        duration={0.6}
      >
        <div className="pointer-events-none absolute inset-0 z-[1] select-none">
          <Grain opacity={0.08} />
        </div>
        <div className="absolute bottom-0 left-[calc(50%-0.5px)] top-0 z-[1] hidden w-px bg-foreground opacity-10 tablet:block" />

        <div className="relative z-[3] flex w-full max-w-[1440px] flex-col gap-[56px] tablet:gap-[110px]">
          {/* Étage 1 : contact en deux moitiés. */}
          <div className="grid w-full grid-cols-1 gap-[40px] tablet:grid-cols-2 tablet:gap-0">
            <div className="accent-clip-titre flex flex-col items-start gap-[28px] overflow-clip tablet:pr-[30px] tablet:gap-[40px]">
              <div className="accent-room flex w-full flex-col gap-[20px] [--accent-room:22px] tablet:gap-[28px]">
                <TitreDemi lignes={titre} encre="text-foreground" />
                {subtext ? (
                  <p className="m-0 max-w-[420px] text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground-60 tablet:text-[18px]">
                    {subtextBefore}
                    <span className="text-foreground">{subtextEmphasis}</span>
                    {subtextAfter}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col items-start gap-[10px]">
                {/* Le numéro reste conditionné : `contact.phone` vide = rien. */}
                {contact.phone ? (
                  <a
                    href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                    className={`text-[30px] font-semibold leading-[1] tracking-[-0.03em] tablet:text-[36px] desktop:text-[44px] ${inlineLinkCls}`}
                  >
                    {contact.phone}
                  </a>
                ) : null}
                <a href={`mailto:${contact.email}`} className={`text-[18px] font-medium leading-[1.2] tracking-[-0.01em] ${inlineLinkCls}`}>
                  {contact.email}
                </a>
                {/* Le créneau en visio à égalité avec le numéro (revue design du
                    2026-11-27) : il ouvre l'onglet rendez-vous du formulaire. */}
                {footerForm?.modes ? (
                  <div className="mt-[10px]">
                    <BoutonAppel href="#rendez-vous" label={footerForm.modes.rendezVous} taille="grand" icone="agenda" />
                  </div>
                ) : null}
                {contact.address || contact.responseTime ? (
                  <p className="m-0 mt-[6px] max-w-[360px] text-[13px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground-60">
                    {[contact.address, contact.responseTime].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
            </div>

            {/* SANS FORMULAIRE (`/rdv`) : la moitié droite reste vide. */}
            {footerForm ? (
              <div className="flex flex-col tablet:pl-[30px] desktop:pl-[60px]">
                {sujetRendezVous ? (
                  <FooterContact
                    modes={footerForm.modes}
                    message={formulaireMessage}
                    rendezVous={
                      typesRendezVous.length > 0 ? (
                        <ReservationRendezVous
                          types={typesVisibles(typesRendezVous, sujetRendezVous)}
                          emailContact={contact.email}
                          typeInitial={
                            typesRendezVous.some((type) => type.id === sujetRendezVous)
                              ? sujetRendezVous
                              : undefined
                          }
                        />
                      ) : undefined
                    }
                  />
                ) : (
                  <Suspense
                    fallback={
                      <FooterContact
                        modes={footerForm.modes}
                        message={formulaireMessage}
                        rendezVous={
                          typesRendezVous.length > 0 ? (
                            <ReservationRendezVous
                              types={typesVisibles(typesRendezVous)}
                              emailContact={contact.email}
                            />
                          ) : undefined
                        }
                      />
                    }
                  >
                    <FooterContactAvecSujet
                      modes={footerForm.modes}
                      message={formulaireMessage}
                      rendezVous={
                        typesRendezVous.length > 0 ? (
                          <ReservationAvecSujet types={typesRendezVous} emailContact={contact.email} />
                        ) : undefined
                      }
                    />
                  </Suspense>
                )}
              </div>
            ) : null}
          </div>

          {/* Étage 2 : une seule bande de liens. `pb-[70px]` sous 810 : le
              bouton du menu flottant recouvrait la dernière ligne. */}
          <div className="relative flex w-full flex-col gap-[22px] border-t border-foreground/10 pt-[24px] pb-[70px] tablet:flex-row tablet:flex-wrap tablet:items-center tablet:justify-between tablet:gap-x-[32px] tablet:gap-y-[16px] tablet:pb-0">
            <Logo brand={brand} className="w-min" />
            <nav aria-label={uiLabels.chrome.footerNavAriaLabel} className="flex flex-wrap items-center gap-x-[20px] gap-y-[8px]">
              {footerNav.map((l) => (
                <HoverPrefetchLink
                  key={l.href}
                  href={l.href}
                  {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={`text-[15px] font-medium leading-[1.2] tracking-[-0.01em] ${inlineLinkCls}`}
                >
                  {l.label}
                </HoverPrefetchLink>
              ))}
            </nav>
            <div className="flex flex-wrap items-center gap-x-[18px] gap-y-[14px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em]">
              {contact.localLinks?.map((lien) => (
                <HoverPrefetchLink key={lien.href} href={lien.href} className={petitLienCls}>
                  {lien.label}
                </HoverPrefetchLink>
              ))}
              {legalLinks.map((l) => (
                <HoverPrefetchLink key={l.href} href={l.href} className={petitLienCls}>
                  {l.shortLabel ?? l.label}
                </HoverPrefetchLink>
              ))}
              {/* « Cookies » rouvre le choix de consentement (`ConsentProvider`). */}
              <ConsentPreferencesLink />
            </div>
            <div className="flex items-center gap-[18px]">
              <div className="flex items-center gap-[12px]">
                {socials.map((s) => (
                  <SocialIcon key={s.href} social={s} />
                ))}
              </div>
              <p className="m-0 whitespace-nowrap text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
                {copyrightLong}
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </>
  );
}
