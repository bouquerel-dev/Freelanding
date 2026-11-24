import * as testeur from "bun:test";
import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { rendezVousContent } from "@/content/rendez-vous";
import { ReservationRendezVous } from "./ReservationRendezVous";

/**
 * LE PARCOURS EN TROIS ÉTAPES, SUIVI COMME UN VISITEUR (2026-11-24) : le
 * créneau, affiché dès l'arrivée ; le sujet, écrit avec ses mots ; les
 * coordonnées. Ni cadrage, ni budget : ce que le navigateur envoie se limite à
 * ces champs.
 *
 * Rien ne sort du processus : `fetch` est remplacé, la clef Turnstile est posée
 * par `scripts/test-turnstile-env.mjs` et le widget est factice.
 */

const C = rendezVousContent;
/** Ce que `ReservationAvecSujet` donne au bloc : jamais un sujet réservé aux clients. */
const PROSPECTS = C.types.filter((t) => !t.prive);

const CRENEAUX = {
  fenetre: {
    debut: "2026-11-02",
    fin: "2026-11-30",
    mois: "2026-11",
    libelle: "novembre 2026",
    premiere: true,
    derniere: false,
  },
  durees: { options: [30, 45, 60], defaut: 45 },
  duree: 45,
  jours: [
    {
      jour: "2026-11-03",
      libelle: "mardi 3 novembre",
      libelleCourt: "mar. 3",
      creneaux: [
        {
          debut: "2026-11-03T14:00:00.000Z",
          heure: "15:00",
          resume: "mardi 3 novembre à 15:00",
        },
      ],
    },
  ],
};

function installerDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/contact",
    pretendToBeVisual: true,
  });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: globalThis.navigator,
    fetch: globalThis.fetch,
    Event: globalThis.Event,
    CustomEvent: globalThis.CustomEvent,
    FormData: globalThis.FormData,
    self: globalThis.self,
    IntersectionObserver: globalThis.IntersectionObserver,
  };
  // Un autre fichier de test peut avoir laissé un `IntersectionObserver`
  // factice : sans observateur, les créneaux se demandent tout de suite.
  delete globalThis.IntersectionObserver;
  globalThis.window = dom.window;
  // `next/link` lit `self` (requestIdleCallback) : défini sous bun, pas sous vitest.
  globalThis.self = dom.window;
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
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  // Widget factice : un jeton à l'affichage, un neuf à chaque réinitialisation
  // (le jeton est à usage unique, le composant réinitialise après chaque envoi).
  let rappel;
  dom.window.turnstile = {
    render(_conteneur, options) {
      rappel = options.callback;
      rappel("jeton-de-test");
      return "widget-de-test";
    },
    reset() {
      rappel?.("jeton-de-test");
    },
    remove() {},
  };
  return {
    restaurer() {
      globalThis.window = precedent.window;
      globalThis.document = precedent.document;
      globalThis.fetch = precedent.fetch;
      globalThis.Event = precedent.Event;
      globalThis.CustomEvent = precedent.CustomEvent;
      globalThis.FormData = precedent.FormData;
      globalThis.self = precedent.self;
      if (precedent.IntersectionObserver) globalThis.IntersectionObserver = precedent.IntersectionObserver;
      Object.defineProperty(globalThis, "navigator", {
        value: precedent.navigator,
        configurable: true,
        writable: true,
      });
    },
  };
}

/**
 * `fetch` factice : les créneaux à chaque GET, puis les réponses de POST dans
 * l'ordre donné. Chaque corps envoyé est gardé pour être relu.
 */
function simulerServeur(reponsesPost) {
  const envois = [];
  globalThis.fetch = async (url, options) => {
    if (String(url).startsWith("/api/rendez-vous/creneaux")) {
      return { ok: true, status: 200, json: async () => CRENEAUX };
    }
    envois.push(JSON.parse(options.body));
    const { status, corps } = reponsesPost.shift();
    return { ok: status === 200, status, json: async () => corps };
  };
  return envois;
}

const attendre = (ms) => new Promise((resoudre) => setTimeout(resoudre, ms));


/** Monte le bloc. `options` passe tel quel au composant (types, sujets de départ). */
async function monter(typeInitial, options = {}) {
  const proposes = typeInitial && C.types.find((t) => t.id === typeInitial)?.prive
    ? C.types.filter((t) => t.id === typeInitial)
    : PROSPECTS;
  const conteneur = document.createElement("div");
  document.body.appendChild(conteneur);
  const racine = createRoot(conteneur);
  await act(async () => {
    racine.render(
      createElement(ReservationRendezVous, {
        types: proposes,
        emailContact: "contact@exemple.fr",
        ...(typeInitial ? { typeInitial } : {}),
        ...options,
      }),
    );
    await attendre(20);
  });
  await act(async () => attendre(20));
  return { conteneur, racine };
}

const texte = (conteneur) => conteneur.textContent ?? "";

function bouton(conteneur, libelle) {
  const trouve = [...conteneur.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").includes(libelle),
  );
  if (!trouve) throw new Error(`bouton introuvable : ${libelle}`);
  return trouve;
}

async function cliquer(element, ms = 20) {
  await act(async () => {
    element.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await attendre(ms);
  });
}

async function choisir(conteneur, groupe, valeur) {
  const radio = conteneur.querySelector(`input[type=radio][name$="-${groupe}"][value="${valeur}"]`);
  if (!radio) throw new Error(`réponse introuvable : ${groupe}=${valeur}`);
  await cliquer(radio);
}

/**
 * Écrit dans un champ contrôlé par React.
 *
 * L'ÉVÉNEMENT `input` NE SUFFIT PAS ICI : `react-dom` est importé avant que le
 * DOM simulé existe, il croit donc le navigateur incapable de cet événement et
 * l'ignore. Le gestionnaire `onChange` du champ est appelé directement, avec
 * la valeur écrite dans le DOM.
 */
async function saisir(conteneur, nom, valeur) {
  const champ = conteneur.querySelector(`input[name="${nom}"], textarea[name="${nom}"]`);
  if (!champ) throw new Error(`champ introuvable : ${nom}`);
  const prototype =
    champ.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
  const cle = Object.keys(champ).find((k) => k.startsWith("__reactProps"));
  await act(async () => {
    setter.call(champ, valeur);
    champ[cle].onChange({ target: champ });
    await attendre(5);
  });
}

async function soumettre(conteneur) {
  await act(async () => {
    conteneur
      .querySelector("form")
      .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    // Le sondage de `obtenirJeton` passe toutes les 150 ms.
    await attendre(400);
  });
}

/** Titre de l'étape affichée. */
const titre = (conteneur) => conteneur.querySelector("h3")?.textContent;
const champ = (conteneur, nom) => conteneur.querySelector(`input[name="${nom}"], textarea[name="${nom}"]`);

const continuer = (conteneur) => cliquer(bouton(conteneur, C.etapes.continuer));

/** Nom, e-mail et téléphone d'un visiteur. */
async function donnerCoordonnees(conteneur, telephone = "06 12 34 56 78") {
  await saisir(conteneur, "nom", "Camille Renard");
  await saisir(conteneur, "email", "camille@exemple.fr");
  await saisir(conteneur, "telephone", telephone);
}

const SUJET_LIBRE = "Refaire le site de mon cabinet.";

/** Heure de 15:00, sujet écrit, puis l'étape des coordonnées. */
async function allerAuxCoordonnees(conteneur, sujet = SUJET_LIBRE) {
  await cliquer(bouton(conteneur, "15:00"));
  await continuer(conteneur);
  await saisir(conteneur, "message", sujet);
  await continuer(conteneur);
  expect(titre(conteneur)).toBe(C.etapes.titres[2]);
}

const sujets = (conteneur) =>
  [...conteneur.querySelectorAll('input[type=radio][name$="-sujet"]')].map((r) => r.value);

const calendrier = (conteneur) =>
  conteneur.querySelector('[aria-label="' + C.creneaux.libelleCalendrier + '"]');

function nettoyage() {
  const etat = { contexte: undefined, montage: undefined };
  afterEach(async () => {
    if (etat.montage) {
      await act(async () => etat.montage.racine.unmount());
      etat.montage = undefined;
    }
    if (etat.contexte) {
      await attendre(20);
      etat.contexte.restaurer();
      etat.contexte = undefined;
    }
  });
  return etat;
}

describe("ReservationRendezVous — trois étapes", () => {
  const etat = nettoyage();

  it("sans sujet dans l'URL : créneaux dès l'arrivée, aucun bouton de sujet, type « decouverte »", async () => {
    etat.contexte = installerDom();
    const demandes = [];
    const envois = simulerServeur([{ status: 200, corps: { ok: true } }]);
    const intercepte = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      demandes.push(String(url));
      return intercepte(url, options);
    };
    etat.montage = await monter();
    const { conteneur } = etat.montage;

    expect(titre(conteneur)).toBe(C.etapes.titres[0]);
    expect(texte(conteneur)).toContain(C.etapes.compteur(1, 3));
    expect(sujets(conteneur)).toEqual([]);
    for (const type of PROSPECTS) expect(texte(conteneur)).not.toContain(type.nom);
    expect(texte(conteneur)).not.toContain(C.formulaire.choisirSujet);
    expect(calendrier(conteneur)).not.toBeNull();
    expect(bouton(conteneur, "15:00")).toBeTruthy();
    expect(demandes.some((u) => u.includes("type=decouverte"))).toBe(true);
    // Les coordonnées n'existent pas encore à l'écran.
    expect(champ(conteneur, "nom")).toBeNull();
    expect(champ(conteneur, "message")).toBeNull();

    await allerAuxCoordonnees(conteneur);
    await donnerCoordonnees(conteneur);
    await soumettre(conteneur);
    expect(envois).toHaveLength(1);
    expect(envois[0].type).toBe("decouverte");
  });

  it("un sujet par défaut donné par l'appelant est celui qui part", async () => {
    etat.contexte = installerDom();
    const envois = simulerServeur([{ status: 200, corps: { ok: true } }]);
    etat.montage = await monter(undefined, { typeParDefaut: "ia" });
    const { conteneur } = etat.montage;
    await allerAuxCoordonnees(conteneur);
    await donnerCoordonnees(conteneur);
    await soumettre(conteneur);
    expect(envois[0].type).toBe("ia");
  });

  it("un sujet présélectionné part comme type, et l'envoi porte exactement le formulaire", async () => {
    etat.contexte = installerDom();
    const envois = simulerServeur([{ status: 200, corps: { ok: true } }]);
    etat.montage = await monter("logiciel");
    const { conteneur } = etat.montage;

    expect(sujets(conteneur)).toEqual([]);
    await cliquer(bouton(conteneur, "15:00"));
    expect(texte(conteneur)).toContain(C.recapitulatif);
    expect(texte(conteneur)).toContain("mardi 3 novembre à 15:00");
    await continuer(conteneur);

    expect(titre(conteneur)).toBe(C.etapes.titres[1]);
    const zone = champ(conteneur, "message");
    expect(zone.tagName).toBe("TEXTAREA");
    expect(zone.required).toBe(true);
    expect(conteneur.querySelector(`label[for="${zone.id}"]`).className).toContain("sr-only");
    expect(texte(conteneur)).toContain("mardi 3 novembre à 15:00");
    await saisir(conteneur, "message", SUJET_LIBRE);
    await continuer(conteneur);

    expect(titre(conteneur)).toBe(C.etapes.titres[2]);
    expect(champ(conteneur, "telephone").required).toBe(true);
    expect(bouton(conteneur, C.formulaire.envoyer).getAttribute("type")).toBe("submit");
    await donnerCoordonnees(conteneur);
    await soumettre(conteneur);

    expect(envois).toHaveLength(1);
    const { debutMs, referenceInterne, ...reste } = envois[0];
    expect(typeof debutMs).toBe("number");
    // Le piège à robots part vide.
    expect(referenceInterne).toBe("");
    expect(reste).toEqual({
      type: "logiciel",
      debut: "2026-11-03T14:00:00.000Z",
      nom: "Camille Renard",
      email: "camille@exemple.fr",
      telephone: "06 12 34 56 78",
      message: SUJET_LIBRE,
      jetonCaptcha: "jeton-de-test",
      fournisseurCaptcha: "turnstile",
    });
    expect(texte(conteneur)).toContain(C.succes.titre);
    expect(texte(conteneur)).toContain(C.succes.texte);
    expect(texte(conteneur)).toContain("mardi 3 novembre à 15:00");
  });

  it("chaque étape refuse ce qui manque, nomme le champ et garde le visiteur sur place", async () => {
    etat.contexte = installerDom();
    const envois = simulerServeur([]);
    etat.montage = await monter();
    const { conteneur } = etat.montage;

    // Étape 1 : pas d'heure.
    await continuer(conteneur);
    expect(titre(conteneur)).toBe(C.etapes.titres[0]);
    expect(texte(conteneur)).toContain(C.formulaire.choisirHeure);
    // Entrée dans le formulaire : même refus, rien ne part.
    await soumettre(conteneur);
    expect(titre(conteneur)).toBe(C.etapes.titres[0]);
    expect(envois).toHaveLength(0);

    // Étape 2 : sujet vide, puis trop court.
    await cliquer(bouton(conteneur, "15:00"));
    expect(texte(conteneur)).not.toContain(C.formulaire.choisirHeure);
    await continuer(conteneur);
    await continuer(conteneur);
    expect(titre(conteneur)).toBe(C.etapes.titres[1]);
    expect(texte(conteneur)).toContain(C.formulaire.messageErreur);
    const zone = champ(conteneur, "message");
    expect(zone.getAttribute("aria-invalid")).toBe("true");
    expect(conteneur.querySelector(`#${zone.getAttribute("aria-describedby")}`).textContent).toBe(
      C.formulaire.messageErreur,
    );
    // Le message s'affiche sous le champ, pas une seconde fois au-dessus des boutons.
    expect(conteneur.querySelector('[role="status"]').textContent).toBe("");
    await saisir(conteneur, "message", "  a  ");
    await continuer(conteneur);
    expect(titre(conteneur)).toBe(C.etapes.titres[1]);
    await saisir(conteneur, "message", "Site");
    await continuer(conteneur);
    expect(titre(conteneur)).toBe(C.etapes.titres[2]);

    // Étape 3 : téléphone vide, puis faux.
    await donnerCoordonnees(conteneur, "");
    await soumettre(conteneur);
    expect(envois).toHaveLength(0);
    expect(texte(conteneur)).toContain(C.formulaire.telephoneErreur);
    expect(champ(conteneur, "telephone").getAttribute("aria-invalid")).toBe("true");

    await saisir(conteneur, "telephone", "abc");
    await soumettre(conteneur);
    expect(envois).toHaveLength(0);
    expect(texte(conteneur)).toContain("Ce numéro de téléphone ne semble pas valide.");
    expect(titre(conteneur)).toBe(C.etapes.titres[2]);
  });

  it("« Retour » et « Modifier » gardent l'heure choisie et le sujet écrit", async () => {
    etat.contexte = installerDom();
    simulerServeur([]);
    etat.montage = await monter();
    const { conteneur } = etat.montage;
    await allerAuxCoordonnees(conteneur);
    await saisir(conteneur, "nom", "Camille Renard");

    await cliquer(bouton(conteneur, C.etapes.retour));
    expect(titre(conteneur)).toBe(C.etapes.titres[1]);
    expect(champ(conteneur, "message").value).toBe(SUJET_LIBRE);
    expect(texte(conteneur)).toContain("mardi 3 novembre à 15:00");

    await cliquer(bouton(conteneur, C.etapes.retour));
    expect(titre(conteneur)).toBe(C.etapes.titres[0]);
    expect(bouton(conteneur, "15:00").getAttribute("aria-pressed")).toBe("true");
    expect(texte(conteneur)).toContain(C.recapitulatif);
    // Aucun « Retour » à la première étape.
    expect(() => bouton(conteneur, C.etapes.retour)).toThrow();

    await continuer(conteneur);
    expect(champ(conteneur, "message").value).toBe(SUJET_LIBRE);
    await continuer(conteneur);
    expect(champ(conteneur, "nom").value).toBe("Camille Renard");

    await cliquer(bouton(conteneur, C.etapes.modifier));
    expect(titre(conteneur)).toBe(C.etapes.titres[0]);
    expect(bouton(conteneur, "15:00").getAttribute("aria-pressed")).toBe("true");
    await continuer(conteneur);
    expect(champ(conteneur, "message").value).toBe(SUJET_LIBRE);
  });

  it("le titre de la nouvelle étape prend le focus", async () => {
    etat.contexte = installerDom();
    simulerServeur([]);
    etat.montage = await monter();
    const { conteneur } = etat.montage;
    expect(document.activeElement).not.toBe(conteneur.querySelector("h3"));
    await cliquer(bouton(conteneur, "15:00"));
    await continuer(conteneur);
    expect(document.activeElement).toBe(conteneur.querySelector("h3"));
    expect(document.activeElement.textContent).toBe(C.etapes.titres[1]);
  });

  it("un champ refusé par le serveur s'affiche sous ce champ et ramène à son étape", async () => {
    etat.contexte = installerDom();
    const envois = simulerServeur([
      { status: 400, corps: { message: "Cette adresse ne semble pas valide.", champ: "email" } },
      { status: 400, corps: { message: "Le sujet est trop long.", champ: "message" } },
    ]);
    etat.montage = await monter("logiciel");
    const { conteneur } = etat.montage;
    await allerAuxCoordonnees(conteneur);
    await donnerCoordonnees(conteneur);

    await soumettre(conteneur);
    expect(envois).toHaveLength(1);
    expect(titre(conteneur)).toBe(C.etapes.titres[2]);
    const adresse = champ(conteneur, "email");
    expect(adresse.getAttribute("aria-invalid")).toBe("true");
    expect(conteneur.querySelector(`#${adresse.getAttribute("aria-describedby")}`).textContent).toBe(
      "Cette adresse ne semble pas valide.",
    );
    expect(conteneur.querySelector('[role="status"]').textContent).toBe("");

    await soumettre(conteneur);
    expect(envois).toHaveLength(2);
    expect(titre(conteneur)).toBe(C.etapes.titres[1]);
    expect(champ(conteneur, "message").getAttribute("aria-invalid")).toBe("true");
    expect(texte(conteneur)).toContain("Le sujet est trop long.");
    expect(champ(conteneur, "message").value).toBe(SUJET_LIBRE);
  });

  it("un créneau pris entre-temps ramène au calendrier, vide l'heure et recharge l'agenda", async () => {
    etat.contexte = installerDom();
    let lectures = 0;
    const envois = simulerServeur([
      { status: 409, corps: { message: "Ce créneau vient d’être pris.", champ: "creneau" } },
    ]);
    const intercepte = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      // Le mois affiché seulement : le mois suivant se lit à part (`mois=`).
      if (String(url).startsWith("/api/rendez-vous/creneaux") && !String(url).includes("mois=2026-12")) lectures += 1;
      return intercepte(url, options);
    };
    etat.montage = await monter("logiciel");
    const { conteneur } = etat.montage;
    await allerAuxCoordonnees(conteneur);
    await donnerCoordonnees(conteneur);
    const avant = lectures;
    await soumettre(conteneur);

    expect(envois).toHaveLength(1);
    expect(titre(conteneur)).toBe(C.etapes.titres[0]);
    expect(texte(conteneur)).toContain("Ce créneau vient d’être pris.");
    expect(texte(conteneur)).not.toContain(C.recapitulatif);
    expect(bouton(conteneur, "15:00").getAttribute("aria-pressed")).toBe("false");
    expect(lectures).toBe(avant + 1);

    // Le reste du formulaire est gardé.
    await cliquer(bouton(conteneur, "15:00"));
    await continuer(conteneur);
    expect(champ(conteneur, "message").value).toBe(SUJET_LIBRE);
    await continuer(conteneur);
    expect(champ(conteneur, "nom").value).toBe("Camille Renard");
  });

  it("après une réservation, « Prendre un autre rendez-vous » revient au créneau, coordonnées gardées", async () => {
    etat.contexte = installerDom();
    simulerServeur([{ status: 200, corps: { ok: true } }]);
    etat.montage = await monter("logiciel");
    const { conteneur } = etat.montage;
    await allerAuxCoordonnees(conteneur);
    await donnerCoordonnees(conteneur);
    await soumettre(conteneur);
    expect(texte(conteneur)).toContain(C.succes.titre);
    expect(conteneur.querySelector("form")).toBeNull();

    await cliquer(bouton(conteneur, C.succes.autre));
    await act(async () => attendre(20));
    expect(conteneur.querySelector("form")).not.toBeNull();
    expect(titre(conteneur)).toBe(C.etapes.titres[0]);
    expect(texte(conteneur)).not.toContain(C.recapitulatif);

    await cliquer(bouton(conteneur, "15:00"));
    await continuer(conteneur);
    // Le sujet repart à zéro, les coordonnées restent : le visiteur ne les retape pas.
    expect(champ(conteneur, "message").value).toBe("");
    await saisir(conteneur, "message", "Un second rendez-vous.");
    await continuer(conteneur);
    expect(champ(conteneur, "nom").value).toBe("Camille Renard");
  });

  it("un second appui pendant l'envoi ne réserve pas deux fois", async () => {
    etat.contexte = installerDom();
    const envois = [];
    globalThis.fetch = async (url, options) => {
      if (String(url).startsWith("/api/rendez-vous/creneaux")) {
        return { ok: true, status: 200, json: async () => CRENEAUX };
      }
      envois.push(JSON.parse(options.body));
      return new Promise(() => {});
    };
    etat.montage = await monter("logiciel");
    const { conteneur } = etat.montage;
    await allerAuxCoordonnees(conteneur);
    await donnerCoordonnees(conteneur);
    await soumettre(conteneur);
    expect(texte(conteneur)).toContain(C.formulaire.envoiEnCours);
    expect(bouton(conteneur, C.formulaire.envoiEnCours).disabled).toBe(true);
    await soumettre(conteneur);
    expect(envois).toHaveLength(1);
  });

  it("coupure réseau ou réponse illisible : le message dit quoi faire, le formulaire reste", async () => {
    etat.contexte = installerDom();
    const reponses = [
      () => {
        throw new Error("reseau");
      },
      () => ({ ok: false, status: 500, json: async () => Promise.reject(new Error("pas du json")) }),
    ];
    globalThis.fetch = async (url) => {
      if (String(url).startsWith("/api/rendez-vous/creneaux")) {
        return { ok: true, status: 200, json: async () => CRENEAUX };
      }
      return reponses.shift()();
    };
    etat.montage = await monter("logiciel");
    const { conteneur } = etat.montage;
    await allerAuxCoordonnees(conteneur);
    await donnerCoordonnees(conteneur);

    await soumettre(conteneur);
    expect(texte(conteneur)).toContain("La connexion a échoué.");
    expect(titre(conteneur)).toBe(C.etapes.titres[2]);
    await soumettre(conteneur);
    expect(texte(conteneur)).toContain("Écrivez-moi directement à contact@exemple.fr");
    expect(titre(conteneur)).toBe(C.etapes.titres[2]);
    expect(champ(conteneur, "nom").value).toBe("Camille Renard");
  });

  it("un sujet de client seul : son nom en texte, aucun bouton, sujet et téléphone facultatifs", async () => {
    etat.contexte = installerDom();
    const envois = simulerServeur([{ status: 200, corps: { ok: true } }]);
    etat.montage = await monter("demonstration");
    const { conteneur } = etat.montage;
    const nomType = C.types.find((t) => t.id === "demonstration").nom;

    expect(sujets(conteneur)).toEqual([]);
    expect(texte(conteneur)).toContain(nomType);
    await cliquer(bouton(conteneur, "15:00"));
    await continuer(conteneur);

    expect(titre(conteneur)).toBe(C.etapes.titres[1]);
    expect(champ(conteneur, "message").required).toBe(false);
    expect(texte(conteneur)).toContain(`${nomType} · mardi 3 novembre à 15:00`);
    // Sujet vide : on passe quand même.
    await continuer(conteneur);
    expect(titre(conteneur)).toBe(C.etapes.titres[2]);
    expect(texte(conteneur)).toContain(C.formulaire.telephoneLabelClient);
    expect(champ(conteneur, "telephone").required).toBe(false);
    await saisir(conteneur, "nom", "Camille Renard");
    await saisir(conteneur, "email", "camille@exemple.fr");
    await soumettre(conteneur);

    expect(envois).toHaveLength(1);
    expect(envois[0]).toMatchObject({ type: "demonstration", nom: "Camille Renard", telephone: "", message: "" });
    expect(texte(conteneur)).toContain(C.succes.titre);
  });

  it("la page client : quatre sujets à choisir d'abord, nom et e-mail suffisent, un faux numéro reste refusé", async () => {
    etat.contexte = installerDom();
    const demandes = [];
    const envois = simulerServeur([{ status: 200, corps: { ok: true } }]);
    const intercepte = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      demandes.push(String(url));
      return intercepte(url, options);
    };
    const conteneur = document.createElement("div");
    document.body.appendChild(conteneur);
    const racine = createRoot(conteneur);
    etat.montage = { conteneur, racine };
    await act(async () => {
      racine.render(
        createElement(ReservationRendezVous, {
          types: C.types.filter((t) => t.prive),
          emailContact: "contact@exemple.fr",
        }),
      );
      await attendre(20);
    });
    expect(sujets(conteneur)).toEqual(["point-rapide", "demonstration", "proposition", "point-d-etape"]);
    expect([...conteneur.querySelectorAll('input[type=radio][name$="-sujet"]')].some((r) => r.checked)).toBe(false);
    expect(texte(conteneur)).toContain(C.formulaire.choisirSujet);
    expect(calendrier(conteneur)).toBeNull();
    expect(demandes.filter((u) => u.startsWith("/api/rendez-vous/creneaux"))).toEqual([]);

    await continuer(conteneur);
    expect(titre(conteneur)).toBe(C.etapes.titres[0]);

    await choisir(conteneur, "sujet", "proposition");
    await act(async () => attendre(20));
    expect(texte(conteneur)).not.toContain(C.formulaire.choisirSujet);
    expect(demandes.some((u) => u.includes("type=proposition"))).toBe(true);
    await cliquer(bouton(conteneur, "15:00"));
    await continuer(conteneur);
    await saisir(conteneur, "message", "Relire le devis du module stock.");
    await continuer(conteneur);
    await saisir(conteneur, "nom", "Camille Renard");
    await saisir(conteneur, "email", "camille@exemple.fr");
    await saisir(conteneur, "telephone", "abc");
    await soumettre(conteneur);
    expect(envois).toHaveLength(0);
    expect(texte(conteneur)).toContain("Ce numéro de téléphone ne semble pas valide.");

    await saisir(conteneur, "telephone", "");
    await soumettre(conteneur);
    expect(envois).toHaveLength(1);
    expect(envois[0]).toMatchObject({ type: "proposition", message: "Relire le devis du module stock.", telephone: "" });
    expect(texte(conteneur)).toContain(C.succes.titre);
  });
});

describe("ReservationRendezVous — mouvement et défilement", () => {
  const etat = nettoyage();

  /** Le haut du bloc est au-dessus de l'écran : le changement d'étape le ramène. */
  async function parcourir(reduit) {
    etat.contexte = installerDom();
    simulerServeur([]);
    window.matchMedia = () => ({ matches: reduit, addEventListener() {}, removeEventListener() {} });
    const defilements = [];
    window.HTMLElement.prototype.scrollIntoView = (options) => defilements.push(options);
    window.HTMLElement.prototype.getBoundingClientRect = () => ({ top: -300, bottom: 0, left: 0, right: 0, width: 0, height: 0 });
    etat.montage = await monter();
    const { conteneur } = etat.montage;
    // Le premier affichage ne fait pas défiler la page.
    expect(defilements).toEqual([]);
    await cliquer(bouton(conteneur, "15:00"));
    await continuer(conteneur);
    return defilements;
  }

  it("moins de mouvement demandé : l'étape suivante revient en vue sans glisser", async () => {
    expect(await parcourir(true)).toEqual([{ block: "start", behavior: "auto" }]);
  });

  it("sans préférence : l'étape suivante revient en vue en glissant", async () => {
    expect(await parcourir(false)).toEqual([{ block: "start", behavior: "smooth" }]);
  });
});

describe("ReservationRendezVous — états du créneau", () => {
  const etat = nettoyage();

  /** GET des créneaux servis dans l'ordre donné : `"reseau"` = panne, sinon `{ status, corps }`. */
  function simulerCreneaux(reponsesGet, reponsesPost = []) {
    const envois = [];
    globalThis.fetch = async (url, options) => {
      if (String(url).startsWith("/api/rendez-vous/creneaux")) {
        const suivante = reponsesGet.length > 1 ? reponsesGet.shift() : reponsesGet[0];
        if (suivante === "reseau") throw new Error("reseau");
        return { ok: suivante.status === 200, status: suivante.status, json: async () => suivante.corps };
      }
      envois.push(JSON.parse(options.body));
      const { status, corps } = reponsesPost.shift();
      return { ok: status === 200, status, json: async () => corps };
    };
    return envois;
  }

  it("agenda non configuré, panne puis « Réessayer », mois vide", async () => {
    etat.contexte = installerDom();
    simulerCreneaux([{ status: 503, corps: {} }]);
    etat.montage = await monter();
    let { conteneur } = etat.montage;
    expect(texte(conteneur)).toContain(C.creneaux.indisponible);
    expect(() => bouton(conteneur, C.actions.reessayer)).toThrow();
    await act(async () => etat.montage.racine.unmount());

    simulerCreneaux(["reseau", { status: 200, corps: { ...CRENEAUX, jours: [] } }]);
    etat.montage = await monter("demonstration");
    conteneur = etat.montage.conteneur;
    expect(texte(conteneur)).toContain(C.creneaux.erreur);
    await cliquer(bouton(conteneur, C.actions.reessayer), 40);
    expect(texte(conteneur)).toContain(C.creneaux.vide);
    // Mois vide : aucune heure, « Continuer » refuse.
    await continuer(conteneur);
    expect(texte(conteneur)).toContain(C.formulaire.choisirHeure);
    expect(titre(conteneur)).toBe(C.etapes.titres[0]);
  });

  it("sans IntersectionObserver, les créneaux sont demandés tout de suite ; avec, au plus près de l'écran", async () => {
    etat.contexte = installerDom();
    let lectures = 0;
    globalThis.fetch = async (url) => {
      // Le mois affiché seulement : le mois suivant se lit à part (`mois=`).
      if (String(url).startsWith("/api/rendez-vous/creneaux") && !String(url).includes("mois=2026-12")) lectures += 1;
      return { ok: true, status: 200, json: async () => CRENEAUX };
    };
    const observateurs = [];
    globalThis.IntersectionObserver = class {
      constructor(rappel, options) {
        this.rappel = rappel;
        this.options = options;
        observateurs.push(this);
      }
      observe() {}
      disconnect() {}
    };
    try {
      etat.montage = await monter();
      const { conteneur } = etat.montage;
      expect(lectures).toBe(0);
      expect(calendrier(conteneur)).toBeNull();
      const approche = observateurs.find((o) => o.options?.rootMargin === "800px 0px");
      expect(approche).toBeTruthy();
      await act(async () => {
        approche.rappel([{ isIntersecting: true }]);
        await attendre(20);
      });
      expect(lectures).toBe(1);
      expect(calendrier(conteneur)).not.toBeNull();
    } finally {
      delete globalThis.IntersectionObserver;
    }
  });

  it("le calendrier enchaîne sur le mois suivant, son 1er porte le nom du mois, ses jours s'ouvrent", async () => {
    etat.contexte = installerDom();
    const DECEMBRE = {
      ...CRENEAUX,
      fenetre: { ...CRENEAUX.fenetre, debut: "2026-12-01", fin: "2026-12-31", mois: "2026-12", libelle: "décembre 2026", premiere: false },
      jours: [
        {
          jour: "2026-12-01",
          libelle: "mardi 1 décembre",
          libelleCourt: "mar. 1",
          creneaux: [{ debut: "2026-12-01T09:15:00.000Z", heure: "10:15", resume: "mardi 1 décembre à 10:15" }],
        },
      ],
    };
    const demandes = [];
    globalThis.fetch = async (url) => {
      demandes.push(String(url));
      return { ok: true, status: 200, json: async () => (String(url).includes("mois=2026-12") ? DECEMBRE : CRENEAUX) };
    };
    etat.montage = await monter();
    const { conteneur } = etat.montage;
    expect(demandes.some((url) => url.includes("mois=2026-12"))).toBe(true);
    expect(texte(conteneur)).toContain("novembre et décembre 2026");
    const premier = conteneur.querySelector('button[aria-label="mardi 1 décembre"]');
    expect(premier).not.toBeNull();
    expect(premier.disabled).toBe(false);
    expect(premier.textContent).toContain("1");
    expect(premier.textContent.toLowerCase()).toContain("déc");
    await cliquer(premier);
    expect(bouton(conteneur, "10:15")).toBeDefined();
  });

  it("un refus sans champ garde le visiteur sur l'étape des coordonnées avec son message", async () => {
    etat.contexte = installerDom();
    const envois = simulerCreneaux(
      [{ status: 200, corps: CRENEAUX }],
      [{ status: 502, corps: { message: "Le rendez-vous n’a pas pu être enregistré." } }],
    );
    etat.montage = await monter("logiciel");
    const { conteneur } = etat.montage;
    await allerAuxCoordonnees(conteneur);
    await donnerCoordonnees(conteneur);

    await soumettre(conteneur);
    expect(envois).toHaveLength(1);
    expect(conteneur.querySelector('[role="status"]').textContent).toBe("Le rendez-vous n’a pas pu être enregistré.");
    expect(texte(conteneur)).toContain("mardi 3 novembre à 15:00");
    expect(titre(conteneur)).toBe(C.etapes.titres[2]);
  });
});

describe("ReservationRendezVous — protection anti-robot non configurée", () => {
  const etat = nettoyage();

  it("dit la vérité au lieu d'envoyer : message d'indisponibilité, rien ne part", async () => {
    // `bun:test` expose `mock.module`, vitest (sous lequel tourne le gate) `vi.doMock`.
    const chemin = "../forms/protection.ts";
    // Une COPIE des exports : sous bun, `mock.module` réécrit le module en place, et
    // l'espace de noms importé suivrait le faux au lieu de garder le vrai.
    const reel = { ...(await import("../forms/protection.ts")) };
    const faux = () => ({
      ...reel,
      useProtectionFormulaire: () => ({
        fournisseur: "turnstile",
        configure: false,
        refConteneur: { current: null },
        activer() {},
        obtenirJeton: async () => undefined,
        reinitialiser() {},
      }),
    });
    const poser = (module) =>
      testeur.mock?.module ? testeur.mock.module(chemin, module) : testeur.vi.doMock(chemin, module);
    poser(faux);
    try {
      const { ReservationRendezVous: SansCle } = await import("./ReservationRendezVous.tsx?sans-cle");
      etat.contexte = installerDom();
      const envois = simulerServeur([]);
      const conteneur = document.createElement("div");
      document.body.appendChild(conteneur);
      const racine = createRoot(conteneur);
      etat.montage = { conteneur, racine };
      await act(async () => {
        racine.render(createElement(SansCle, { types: PROSPECTS, emailContact: "contact@exemple.fr", typeInitial: "logiciel" }));
        await attendre(20);
      });
      await act(async () => attendre(20));
      await allerAuxCoordonnees(conteneur);
      await donnerCoordonnees(conteneur);
      await soumettre(conteneur);

      expect(envois).toHaveLength(0);
      expect(texte(conteneur)).toContain("protection anti-robot non configurée");
      expect(texte(conteneur)).toContain("contact@exemple.fr");
      expect(titre(conteneur)).toBe(C.etapes.titres[2]);
    } finally {
      poser(() => reel);
    }
  });
});
