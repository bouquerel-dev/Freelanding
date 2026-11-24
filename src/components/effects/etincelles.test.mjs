import { describe, expect, it } from "bun:test";
import { ETINCELLES, REQUETE_ETINCELLES, easeOut, traitsAuTemps } from "./etincelles";

describe("étincelles au clic", () => {
  it("ease-out borné entre 0 et 1, vif au départ", () => {
    expect(easeOut(-1)).toBe(0);
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(2)).toBe(1);
    expect(easeOut(0.25)).toBeGreaterThan(0.5);
  });

  it("huit traits au départ, collés au point cliqué, de la taille maximale", () => {
    const traits = traitsAuTemps(100, 50, 0);
    expect(traits).toHaveLength(ETINCELLES.nombre);
    for (const t of traits) {
      expect(t.x1).toBeCloseTo(100);
      expect(t.y1).toBeCloseTo(50);
      expect(Math.hypot(t.x2 - t.x1, t.y2 - t.y1)).toBeCloseTo(ETINCELLES.taille);
    }
  });

  it("les traits s'éloignent et raccourcissent", () => {
    const [debut] = traitsAuTemps(0, 0, 50);
    const [fin] = traitsAuTemps(0, 0, 350);
    expect(Math.hypot(fin.x1, fin.y1)).toBeGreaterThan(Math.hypot(debut.x1, debut.y1));
    expect(Math.hypot(fin.x2 - fin.x1, fin.y2 - fin.y1)).toBeLessThan(
      Math.hypot(debut.x2 - debut.x1, debut.y2 - debut.y1),
    );
    expect(Math.hypot(fin.x1, fin.y1)).toBeLessThanOrEqual(ETINCELLES.rayon);
  });

  it("aucun trait ne pointe pile vers le haut", () => {
    for (const t of traitsAuTemps(0, 0, 10)) expect(Math.abs(t.x2)).toBeGreaterThan(0.01);
  });

  it("l'éclat finit à 400 ms et n'existe pas avant son départ", () => {
    expect(traitsAuTemps(0, 0, ETINCELLES.dureeMs)).toBeNull();
    expect(traitsAuTemps(0, 0, -1)).toBeNull();
  });

  it("ne vise que la souris, hors mouvement réduit", () => {
    expect(REQUETE_ETINCELLES).toContain("(pointer: fine)");
    expect(REQUETE_ETINCELLES).toContain("(hover: hover)");
    expect(REQUETE_ETINCELLES).toContain("prefers-reduced-motion: no-preference");
  });
});
