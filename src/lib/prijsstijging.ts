// Expected yearly change of the wholesale (day-ahead) electricity price, hand-maintained (prijsstijging/prijsstijging.json)
// → data/prijsstijging.json. The default follows a fixed order: PBL (expected wholesale price, real terms, plus CPB
// inflation to get nominal), else CPB inflation, else a fixed fallback.

export type Bron = { publicatie: string; url: string; datum: string; notitie?: string };
export type PrijsstijgingConfig = {
  gecontroleerdOp: string;
  omschrijving: string;
  volgorde: string;
  pbl?: Bron & { tabel: string; prijspeil: number; groothandelsprijsPerMWh: { vanJaar: number; van: number; naarJaar: number; naar: number }; bandbreedteNaar?: { van: number; tot: number } };
  cpb?: Bron & { inflatieCpi: Record<string, number> };
  terugvalProcentPerJaar: number;
  /** Gas and motor fuel: the same order, each with its own PBL series (a price in real terms, prijspeil) when there is one. */
  dragers?: Partial<Record<Drager, { omschrijving: string; pbl?: Bron & { tabel: string; prijspeil: number; prijs: { eenheid: string; vanJaar: number; van: number; naarJaar: number; naar: number } } }>>;
};
export type Drager = "gas" | "brandstof";
export type Standaard = { procentPerJaar: number; bron: "pbl" | "cpb" | "terugval"; berekening: string };
export type PrijsstijgingBestand = { gegenereerdOp: string; gecontroleerdOp: string; standaard: Standaard; perDrager: Record<Drager, Standaard & { omschrijving: string }> } & Omit<PrijsstijgingConfig, "gecontroleerdOp">;

const afgerond = (x: number) => Math.round(x * 10) / 10;

export function bouwPrijsstijging(cfg: PrijsstijgingConfig, nu: string): PrijsstijgingBestand {
  for (const b of [cfg.pbl, cfg.cpb]) if (b && b.datum > cfg.gecontroleerdOp) throw new Error(`bron ${b.url} heeft een datum na gecontroleerdOp`);
  if (!(cfg.terugvalProcentPerJaar >= -20 && cfg.terugvalProcentPerJaar <= 30)) throw new Error("terugval: tussen -20 en 30 procent per jaar");
  // CPB: the latest year of the CPI forecast.
  const inflatieJaren = Object.keys(cfg.cpb?.inflatieCpi ?? {}).sort();
  const inflatieJaar = inflatieJaren.at(-1);
  const inflatie = inflatieJaar !== undefined ? cfg.cpb!.inflatieCpi[inflatieJaar] : undefined;
  if (inflatie !== undefined && !(inflatie > -10 && inflatie < 20)) throw new Error("cpb: inflatie buiten -10 tot 20 procent");
  let standaard: Standaard;
  if (cfg.pbl) {
    const g = cfg.pbl.groothandelsprijsPerMWh;
    if (!(g.van > 0 && g.naar > 0 && g.naarJaar > g.vanJaar)) throw new Error("pbl: groothandelsprijs en jaren onmogelijk");
    if (g.van > 1000 || g.naar > 1000) throw new Error("pbl: groothandelsprijs in euro per MWh, niet per kWh of in centen");
    const reeel = (g.naar / g.van) ** (1 / (g.naarJaar - g.vanJaar)) - 1;
    const nominaal = inflatie !== undefined ? (1 + reeel) * (1 + inflatie / 100) - 1 : reeel;
    standaard = {
      procentPerJaar: afgerond(nominaal * 100), bron: "pbl",
      berekening: `PBL ${cfg.pbl.publicatie}: groothandelsprijs € ${g.van} per MWh (${g.vanJaar}) naar € ${g.naar} (${g.naarJaar}), prijspeil ${cfg.pbl.prijspeil}: ${afgerond(reeel * 100)}% per jaar`
        + (inflatie !== undefined ? `; plus inflatie ${inflatie}% (CPB, ${inflatieJaar})` : "; zonder inflatie (geen CPB-raming)"),
    };
  } else if (inflatie !== undefined) {
    standaard = { procentPerJaar: afgerond(inflatie), bron: "cpb", berekening: `CPB ${cfg.cpb!.publicatie}: inflatie ${inflatie}% (${inflatieJaar})` };
  } else {
    standaard = { procentPerJaar: cfg.terugvalProcentPerJaar, bron: "terugval", berekening: `geen PBL- of CPB-raming: ${cfg.terugvalProcentPerJaar}% per jaar` };
  }
  // Gas and motor fuel: PBL of that carrier (real, plus the CPB inflation), else the CPB inflation, else the fallback.
  const perDrager = {} as PrijsstijgingBestand["perDrager"];
  for (const d of ["gas", "brandstof"] as Drager[]) {
    const c = cfg.dragers?.[d], p = c?.pbl;
    const omschrijving = c?.omschrijving ?? (d === "gas" ? "Leveringstarief van gas (zonder energiebelasting)." : "Pompprijs van benzine en diesel.");
    if (p) {
      if (p.datum > cfg.gecontroleerdOp) throw new Error(`bron ${p.url} heeft een datum na gecontroleerdOp`);
      if (!(p.prijs.van > 0 && p.prijs.naar > 0 && p.prijs.naarJaar > p.prijs.vanJaar)) throw new Error(`pbl ${d}: prijs en jaren onmogelijk`);
      const reeel = (p.prijs.naar / p.prijs.van) ** (1 / (p.prijs.naarJaar - p.prijs.vanJaar)) - 1;
      const nominaal = inflatie !== undefined ? (1 + reeel) * (1 + inflatie / 100) - 1 : reeel;
      perDrager[d] = {
        omschrijving, procentPerJaar: afgerond(nominaal * 100), bron: "pbl",
        berekening: `PBL ${p.publicatie}: ${p.prijs.eenheid} ${p.prijs.van} (${p.prijs.vanJaar}) naar ${p.prijs.naar} (${p.prijs.naarJaar}), prijspeil ${p.prijspeil}: ${afgerond(reeel * 100)}% per jaar`
          + (inflatie !== undefined ? `; plus inflatie ${inflatie}% (CPB, ${inflatieJaar})` : "; zonder inflatie (geen CPB-raming)"),
      };
    } else if (inflatie !== undefined) {
      perDrager[d] = { omschrijving, procentPerJaar: afgerond(inflatie), bron: "cpb", berekening: `geen PBL-raming voor ${d}; CPB ${cfg.cpb!.publicatie}: inflatie ${inflatie}% (${inflatieJaar})` };
    } else {
      perDrager[d] = { omschrijving, procentPerJaar: cfg.terugvalProcentPerJaar, bron: "terugval", berekening: `geen PBL- of CPB-raming: ${cfg.terugvalProcentPerJaar}% per jaar` };
    }
  }
  const { gecontroleerdOp, $schema: _s, $comment: _c, ...rest } = cfg as typeof cfg & { $schema?: string; $comment?: string };
  return { gegenereerdOp: nu, gecontroleerdOp, standaard, perDrager, ...rest };
}
