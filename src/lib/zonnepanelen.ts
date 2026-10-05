// Purchase price of solar panels on a home per Wp (complete, incl. installation; 0% VAT on homes), hand-maintained
// (zonnepanelen/zonnepanelen.json) → data/zonnepanelen.json, with a few sanity checks.

export type Bron = { url: string; datum: string; notitie?: string };
export type ZonnepanelenConfig = { gecontroleerdOp: string; omschrijving: string; prijsPerWp: { richtwaarde: number; van: number; tot: number }; bronnen: Bron[] };
export type ZonnepanelenBestand = { gegenereerdOp: string; gecontroleerdOp: string; valuta: "EUR" } & Omit<ZonnepanelenConfig, "gecontroleerdOp">;

export function bouwZonnepanelen(cfg: ZonnepanelenConfig, nu: string): ZonnepanelenBestand {
  const p = cfg.prijsPerWp;
  if (!(p.van > 0 && p.van <= p.tot)) throw new Error("prijsPerWp: 'van' moet tussen 0 en 'tot' liggen");
  if (!(p.richtwaarde >= p.van && p.richtwaarde <= p.tot)) throw new Error("prijsPerWp: de richtwaarde moet binnen de bandbreedte liggen");
  if (p.tot > 5) throw new Error("prijsPerWp: meer dan € 5 per Wp is onmogelijk (bedragen in euro per Wp, niet per kWp)");
  if (!cfg.bronnen.length) throw new Error("minstens één bron");
  for (const b of cfg.bronnen) if (b.datum > cfg.gecontroleerdOp) throw new Error(`bron ${b.url} heeft een datum na gecontroleerdOp`);
  const { gecontroleerdOp, $schema: _s, $comment: _c, ...rest } = cfg as typeof cfg & { $schema?: string; $comment?: string };
  return { gegenereerdOp: nu, gecontroleerdOp, valuta: "EUR", ...rest };
}
