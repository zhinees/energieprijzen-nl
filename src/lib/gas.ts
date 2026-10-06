// Average gas contract for households: what the average household pays for gas per m³ and per year with a fixed or
// variable contract, per month, from the same CBS StatLine table as lib/vast.ts (85592NED). Used as a default for
// whoever wants to know what a heat pump saves on gas and does not know their own gas price.

import { CBS_TABEL, INCL_BTW, type CbsRij } from "./vast.ts";

export type GasMaand = {
  /** YYYY-MM */
  maand: string;
  /** Supply price per m³, incl. VAT, excl. energy tax. */
  leveringPerM3: number;
  /** Energy tax per m³, incl. VAT, in that month. */
  energiebelastingPerM3: number;
  /** Supply plus energy tax per m³, incl. VAT: what a consumer sees as 'price per m³'. */
  totaalPerM3: number;
  /** Fixed supply costs per year, incl. VAT. */
  vastPerJaar: number;
  /** Grid costs for gas per year (transporttarief), incl. VAT: what you no longer pay without a gas connection. */
  netbeheerPerJaar: number;
};

export type GasBestand = {
  gegenereerdOp: string;
  valuta: "EUR";
  inclBtw: true;
  omschrijving: string;
  bron: { naam: string; tabel: string; url: string; licentie: string };
  laatste: GasMaand;
  maanden: GasMaand[];
};

const r4 = (v: number) => Math.round(v * 10000) / 10000;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Monthly rows incl. VAT with all gas values, oldest first. */
export function leesCbsGas(rijen: CbsRij[]): GasMaand[] {
  const uit: GasMaand[] = [];
  for (const r of rijen) {
    const m = /^(\d{4})MM(\d{2})$/.exec(r.Perioden.trim());
    if (!m || r.Btw.trim() !== INCL_BTW) continue;
    const lev = r.VariabelLeveringstariefContractprijs_3, eb = r.Energiebelasting_6, vast = r.VastLeveringstariefVasteEnVar_2, net = r.Transporttarief_1;
    if (lev == null || eb == null || vast == null || net == null) continue;
    uit.push({
      maand: `${m[1]}-${m[2]}`, leveringPerM3: r4(lev), energiebelastingPerM3: r4(eb), totaalPerM3: r4(lev + eb),
      vastPerJaar: r2(vast), netbeheerPerJaar: r2(net),
    });
  }
  return uit.sort((a, b) => a.maand.localeCompare(b.maand));
}

export function bouwGas(maanden: GasMaand[], nu: string): GasBestand {
  if (!maanden.length) throw new Error("gas: geen maanden van het CBS");
  for (const m of maanden) {
    if (!(m.leveringPerM3 > 0 && m.leveringPerM3 < 5)) throw new Error(`gas ${m.maand}: leveringstarief ${m.leveringPerM3} €/m³ is onmogelijk`);
    if (!(m.energiebelastingPerM3 >= 0 && m.energiebelastingPerM3 < 3)) throw new Error(`gas ${m.maand}: energiebelasting ${m.energiebelastingPerM3} €/m³ is onmogelijk`);
    if (!(m.vastPerJaar >= 0 && m.vastPerJaar < 1000)) throw new Error(`gas ${m.maand}: vaste leveringskosten ${m.vastPerJaar} €/jaar is onmogelijk`);
    if (!(m.netbeheerPerJaar >= 0 && m.netbeheerPerJaar < 1500)) throw new Error(`gas ${m.maand}: netbeheerkosten ${m.netbeheerPerJaar} €/jaar is onmogelijk`);
  }
  const reeks = maanden.slice(-12);
  return {
    gegenereerdOp: nu,
    valuta: "EUR",
    inclBtw: true,
    omschrijving: "Gemiddeld vast of variabel gascontract voor huishoudens (CBS), per m³ en per jaar, incl. btw. Het leveringstarief is zonder energiebelasting; totaalPerM3 telt de energiebelasting van die maand erbij. netbeheerPerJaar is het transporttarief van de netbeheerder voor gas.",
    bron: {
      naam: "CBS StatLine, Gemiddelde energietarieven voor consumenten",
      tabel: CBS_TABEL,
      url: `https://opendata.cbs.nl/#/CBS/nl/dataset/${CBS_TABEL}/table`,
      licentie: "CC BY 4.0",
    },
    laatste: reeks[reeks.length - 1],
    maanden: reeks,
  };
}
