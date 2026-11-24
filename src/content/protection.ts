/**
 * Mention exigée par Google quand le badge reCAPTCHA est masqué
 * (`.grecaptcha-badge` dans `globals.css`). Affichée sous le bouton d'envoi de
 * chaque formulaire, seulement quand reCAPTCHA est la protection active.
 */
export const mentionRecaptcha = {
  avant: "Protégé par reCAPTCHA : les ",
  confidentialite: {
    label: "règles de confidentialité",
    href: "https://policies.google.com/privacy",
  },
  entre: " et les ",
  conditions: {
    label: "conditions d’utilisation",
    href: "https://policies.google.com/terms",
  },
  apres: " de Google s’appliquent.",
} as const;
