import { afterEach, describe, expect, it } from "bun:test";

import {
  creerVerificateurRecaptcha,
  lireFournisseur,
  lireSeuil,
  resoudreVerificateur,
  SEUIL_RECAPTCHA,
} from "./captcha";

/**
 * reCAPTCHA v3 (2026-11-24) : un score au-dessus du seuil et la bonne action,
 * sinon refus. Turnstile reste le repli tant que la clef Google manque.
 */
const fetchOrigine = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = fetchOrigine;
});

function repondre(charge, statut = 200) {
  const appels = [];
  globalThis.fetch = async (url, init) => {
    appels.push({ url: String(url), corps: String(init.body) });
    return { ok: statut < 400, status: statut, json: async () => charge };
  };
  return appels;
}

describe("creerVerificateurRecaptcha", () => {
  it("accepte un score suffisant pour la bonne action, et envoie secret, jeton et adresse", async () => {
    const appels = repondre({ success: true, score: 0.9, action: "contact" });
    const v = creerVerificateurRecaptcha("secret-x", { action: "contact" });
    expect(await v.verifier("jeton", "203.0.113.5")).toEqual({ ok: true });
    expect(appels[0].url).toBe("https://www.google.com/recaptcha/api/siteverify");
    expect(appels[0].corps).toBe("secret=secret-x&response=jeton&remoteip=203.0.113.5");
  });

  it("refuse un score sous le seuil, une autre action, un échec Google", async () => {
    repondre({ success: true, score: 0.3, action: "contact" });
    expect(await creerVerificateurRecaptcha("s", { action: "contact" }).verifier("j", undefined)).toMatchObject({
      ok: false,
      raison: "jeton_refuse",
    });
    repondre({ success: true, score: 0.9, action: "rendez_vous" });
    expect(await creerVerificateurRecaptcha("s", { action: "contact" }).verifier("j", undefined)).toMatchObject({
      ok: false,
      raison: "jeton_refuse",
    });
    repondre({ success: false, "error-codes": ["invalid-input-response"] });
    expect(await creerVerificateurRecaptcha("s").verifier("j", undefined)).toEqual({
      ok: false,
      raison: "jeton_refuse",
      codes: ["invalid-input-response"],
    });
  });

  it("sans jeton ou sans réponse lisible, refuse sans laisser passer", async () => {
    expect(await creerVerificateurRecaptcha("s").verifier(undefined, undefined)).toEqual({
      ok: false,
      raison: "jeton_absent",
    });
    repondre(null, 500);
    expect(await creerVerificateurRecaptcha("s").verifier("j", undefined)).toMatchObject({
      ok: false,
      raison: "indisponible",
    });
  });
});

describe("resoudreVerificateur", () => {
  it("suit le fournisseur du jeton quand sa clef existe, sinon celui qu'il sait vérifier", () => {
    const deux = { RECAPTCHA_SECRET_KEY: "r", TURNSTILE_SECRET_KEY: "t" };
    expect(resoudreVerificateur({ fournisseur: "recaptcha" }, deux).nom).toBe("recaptcha");
    expect(resoudreVerificateur({ fournisseur: "turnstile" }, deux).nom).toBe("turnstile");
    expect(resoudreVerificateur({}, deux).nom).toBe("recaptcha");
    expect(resoudreVerificateur({ fournisseur: "recaptcha" }, { TURNSTILE_SECRET_KEY: "t" }).nom).toBe("turnstile");
    expect(resoudreVerificateur({ fournisseur: "turnstile" }, { RECAPTCHA_SECRET_KEY: "r" }).nom).toBe("recaptcha");
  });

  it("sans aucune clef, refuse tout", async () => {
    const v = resoudreVerificateur({}, {});
    expect(v.nom).toBe("aucun");
    expect(await v.verifier("j", undefined)).toEqual({ ok: false, raison: "non_configure" });
  });

  it("lit le seuil et le fournisseur avec prudence", () => {
    expect(lireSeuil(undefined)).toBe(SEUIL_RECAPTCHA);
    expect(lireSeuil("0.7")).toBe(0.7);
    expect(lireSeuil("2")).toBe(SEUIL_RECAPTCHA);
    expect(lireSeuil("abc")).toBe(SEUIL_RECAPTCHA);
    expect(lireFournisseur({ fournisseurCaptcha: "recaptcha" })).toBe("recaptcha");
    expect(lireFournisseur({ fournisseurCaptcha: "autre" })).toBeUndefined();
    expect(lireFournisseur(null)).toBeUndefined();
  });
});
