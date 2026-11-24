import { describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { siteConfig } from "@/content/site";
import { FooterContactForm, etatAdresse } from "./FooterContactForm";

/**
 * Le contour d'un champ doit tenir 3:1 sur la carte du pied de page (WCAG
 * 1.4.11). À 25 % de blanc, il plafonnait à 2,1:1 ; 40 % donne environ 3,8:1
 * sur la matière `#131313`, et le survol monte d'un cran au-dessus.
 */
const proprietes = {
  footerForm: siteConfig.footerForm,
  emailContact: siteConfig.contact.email,
  inlineLinkCls: "",
};

const GLOBAUX_DOM = [
  "self",
  "Node",
  "Element",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "SVGElement",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
];

/** DOM réel et widget Turnstile factice, comme `useEnvoiFormulaire.test.mjs`. */
function installerDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const noms = ["window", "document", "fetch", "Event", "CustomEvent", "FormData", "navigator", ...GLOBAUX_DOM];
  const precedent = Object.fromEntries(noms.map((nom) => [nom, globalThis[nom]]));
  for (const nom of GLOBAUX_DOM) globalThis[nom] = dom.window[nom];
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Event = dom.window.Event;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.FormData = dom.window.FormData;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
  dom.window.turnstile = {
    render(_conteneur, options) {
      options.callback("jeton-de-test");
      return "widget-de-test";
    },
    reset() {},
    remove() {},
  };
  return {
    restaurer() {
      for (const nom of noms) {
        Object.defineProperty(globalThis, nom, {
          value: precedent[nom],
          configurable: true,
          writable: true,
        });
      }
    },
  };
}

/** Remplit le formulaire de valeurs que le contrôle local accepte. */
function remplir(conteneur) {
  conteneur.querySelector('textarea[name="message"]').value = "Nos devis partent d'un tableur.";
  conteneur.querySelector('input[name="nom"]').value = "Claire Martin";
  conteneur.querySelector('input[name="email"]').value = "claire.martin@atelier.fr";
  conteneur.querySelector('input[name="telephone"]').value = "06 12 34 56 78";
}

async function soumettre(conteneur, attenteMs = 300) {
  await act(async () => {
    conteneur
      .querySelector("form")
      .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resoudre) => setTimeout(resoudre, attenteMs));
  });
}

describe("FooterContactForm", () => {
  it("dessine chaque champ avec un contour lisible au repos et au survol", () => {
    const html = renderToStaticMarkup(
      createElement(FooterContactForm, proprietes),
    );
    const champs = [...html.matchAll(/<(input|textarea)\b[^>]*class="([^"]*)"/g)]
      .map(([, , classes]) => classes)
      .filter((classes) => classes.includes("neo-champ"));
    expect(champs.length).toBeGreaterThan(1);
    for (const classes of champs) {
      expect(classes).toContain("border-white/40");
      expect(classes).toContain("hover:border-white/60");
      expect(classes).not.toContain("border-white/25");
    }
  });

  for (const [champ, balise] of [
    ["email", "input"],
    ["message", "textarea"],
  ]) {
    it(`marque « ${champ} » refusé quand le serveur le refuse`, async () => {
      const contexte = installerDom();
      globalThis.fetch = async () => ({
        ok: false,
        status: 422,
        json: async () => ({ message: "Champ à corriger.", champ }),
      });
      // Chargé après le DOM : react-dom/client choisit à l'import entre
      // l'événement `input` et l'ancien `attachEvent` d'Internet Explorer.
      const { createRoot } = await import("react-dom/client");
      const conteneur = document.createElement("div");
      document.body.appendChild(conteneur);
      const racine = createRoot(conteneur);
      try {
        await act(async () => {
          racine.render(createElement(FooterContactForm, proprietes));
        });
        const champRefuse = () => conteneur.querySelector(`${balise}[name="${champ}"]`);
        expect(champRefuse().getAttribute("aria-invalid")).toBeNull();
        // Un formulaire valide pour le contrôle local : seul le serveur refuse.
        remplir(conteneur);
        await act(async () => {
          conteneur
            .querySelector("form")
            .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
          // Le sondage du jeton (150 ms) puis la réponse factice.
          await new Promise((resoudre) => setTimeout(resoudre, 400));
        });
        // `.neo-champ[aria-invalid="true"]` passe le contour au rouge d'erreur.
        expect(champRefuse().getAttribute("aria-invalid")).toBe("true");
      } finally {
        await act(async () => racine.unmount());
        contexte.restaurer();
      }
    });
  }

  async function monter(props = proprietes) {
    const contexte = installerDom();
    const { createRoot } = await import("react-dom/client");
    const conteneur = document.createElement("div");
    document.body.appendChild(conteneur);
    const racine = createRoot(conteneur);
    await act(async () => {
      racine.render(createElement(FooterContactForm, props));
    });
    return {
      conteneur,
      async demonter() {
        await act(async () => racine.unmount());
        contexte.restaurer();
      },
    };
  }

  it("un seul écran : le message d'abord, aucun questionnaire ni étape", async () => {
    const { conteneur, demonter } = await monter();
    try {
      const champs = [...conteneur.querySelectorAll("input:not([tabindex='-1']), textarea")].map((c) => c.name);
      expect(champs).toEqual(["message", "nom", "email", "telephone"]);
      expect(conteneur.querySelector('input[type="radio"]')).toBeNull();
      expect(conteneur.querySelector("[data-etape]")).toBeNull();
      expect(bouton(conteneur, siteConfig.footerForm.submitLabel).type).toBe("submit");
    } finally {
      await demonter();
    }
  });

  it("refuse localement chaque champ manquant, l'écrit sous le champ et n'envoie rien", async () => {
    const { conteneur, demonter } = await monter();
    const envois = [];
    globalThis.fetch = async (_url, init) => {
      envois.push(init);
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    };
    try {
      const { erreurs, emailInvalide } = siteConfig.footerForm;
      conteneur.querySelector('input[name="telephone"]').value = "abc";
      await soumettre(conteneur, 20);
      expect(envois).toHaveLength(0);
      const aide = (nom) => {
        const champ = conteneur.querySelector(`[name="${nom}"]`);
        expect(champ.getAttribute("aria-invalid"), nom).toBe("true");
        return document.getElementById(champ.getAttribute("aria-describedby")).textContent;
      };
      expect(aide("message")).toBe(erreurs.message);
      expect(aide("nom")).toBe(erreurs.nom);
      expect(aide("email")).toBe(emailInvalide);
      expect(aide("telephone")).toBe(erreurs.telephone);
      // Le premier champ fautif reprend le focus.
      expect(document.activeElement).toBe(conteneur.querySelector('textarea[name="message"]'));
    } finally {
      await demonter();
    }
  });

  it("vérifie l'adresse e-mail à la sortie du champ", () => {
    // Le branchement sur `onBlur` est vérifié au navigateur : sous la suite
    // complète, `react-dom/client` est chargé avant le DOM par d'autres tests
    // et n'écoute plus `focusout`.
    expect(etatAdresse("", true)).toBe("repos");
    expect(etatAdresse("   ", true)).toBe("repos");
    expect(etatAdresse("claire.martin@", false)).toBe("refuse");
    // `type="email"` accepte une adresse sans point dans le domaine.
    expect(etatAdresse("claire@atelier", true)).toBe("refuse");
    expect(etatAdresse(" claire.martin@atelier.fr ", true)).toBe("valide");
    expect(siteConfig.footerForm.emailInvalide).toContain("exemple@email.com");
  });

  /**
   * Appelle le gestionnaire React d'un élément. Sous la suite complète,
   * `react-dom/client` est chargé avant le DOM par d'autres tests et
   * n'écoute plus `focusout` : passer par la prop garde le test juste dans
   * les deux cas.
   */
  async function declencher(element, gestionnaire) {
    const cle = Object.keys(element).find((nom) => nom.startsWith("__reactProps$"));
    await act(async () => {
      element[cle][gestionnaire]({ currentTarget: element });
    });
  }

  /** Bouton dont le texte contient `libelle`. */
  function bouton(racine, libelle) {
    return [...racine.querySelectorAll("button")].find((b) => b.textContent.includes(libelle));
  }

  it("signale l'adresse refusée sous le champ, puis la retire dès qu'elle est juste", async () => {
    const { conteneur, demonter } = await monter();
    try {
      const email = conteneur.querySelector('input[name="email"]');
      const aide = () => document.getElementById(email.getAttribute("aria-describedby"));
      email.value = "claire.martin@";
      await declencher(email, "onBlur");
      expect(email.getAttribute("aria-invalid")).toBe("true");
      expect(aide().textContent).toBe(siteConfig.footerForm.emailInvalide);
      email.value = "claire.martin@atelier.fr";
      await declencher(email, "onInput");
      expect(email.getAttribute("aria-invalid")).toBeNull();
      expect(email.dataset.etat).toBe("valide");
      expect(aide().textContent).toBe("");
    } finally {
      await demonter();
    }
  });

  it("refuse une adresse sans aide écrite quand le contenu n'en donne pas", async () => {
    const sansTextes = {
      ...proprietes,
      footerForm: {
        ...siteConfig.footerForm,
        namePlaceholder: undefined,
        emailPlaceholder: undefined,
        telephonePlaceholder: undefined,
        messagePlaceholder: undefined,
        emailInvalide: undefined,
      },
    };
    const { conteneur, demonter } = await monter(sansTextes);
    try {
      const email = conteneur.querySelector('input[name="email"]');
      expect(email.getAttribute("placeholder")).toBe("");
      expect(conteneur.querySelector('input[name="telephone"]').getAttribute("placeholder")).toBe("");
      expect(conteneur.querySelector('textarea[name="message"]').getAttribute("placeholder")).toBe("");
      email.value = "claire";
      await declencher(email, "onBlur");
      expect(email.getAttribute("aria-invalid")).toBe("true");
      expect(document.getElementById(email.getAttribute("aria-describedby")).textContent).toBe("");
    } finally {
      await demonter();
    }
  });

  it("se passe du téléphone quand le contenu ne le demande pas", () => {
    const html = renderToStaticMarkup(
      createElement(FooterContactForm, {
        ...proprietes,
        footerForm: { ...siteConfig.footerForm, telephoneLabel: undefined },
      }),
    );
    expect(html).toContain('name="nom"');
    expect(html).toContain('name="message"');
    expect(html).not.toContain('name="telephone"');
  });

  it("envoie le message, les coordonnées et le fournisseur anti-robot, puis se vide", async () => {
    const { conteneur, demonter } = await monter();
    const envois = [];
    let repondre;
    globalThis.fetch = (_url, init) => {
      envois.push(JSON.parse(init.body));
      return new Promise((resoudre) => {
        repondre = () => resoudre({ ok: true, status: 200, json: async () => ({ ok: true }) });
      });
    };
    try {
      const { submitLabel } = siteConfig.footerForm;
      remplir(conteneur);
      await soumettre(conteneur);
      // Pendant l'envoi, le bouton le dit.
      expect(bouton(conteneur, "Envoi…")).toBeDefined();
      expect(bouton(conteneur, submitLabel)).toBeUndefined();
      expect(envois).toHaveLength(1);
      expect(envois[0]).toMatchObject({
        intention: "footer",
        nom: "Claire Martin",
        email: "claire.martin@atelier.fr",
        telephone: "06 12 34 56 78",
        typeProjet: "",
        message: "Nos devis partent d'un tableur.",
        fournisseurCaptcha: "turnstile",
      });

      await act(async () => {
        repondre();
        await new Promise((resoudre) => setTimeout(resoudre, 50));
      });
      // Envoyé : le formulaire se vide.
      expect(conteneur.querySelector('textarea[name="message"]').value).toBe("");
    } finally {
      await demonter();
    }
  });
});
