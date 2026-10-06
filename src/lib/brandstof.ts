// Pump prices of petrol (Euro95) and diesel: the national daily average from CBS StatLine 80416NED ("Pompprijzen
// motorbrandstoffen"), as monthly averages and the average of the last 30 days. Used as a default for whoever wants to
// know what an electric car saves on fuel and does not know their own price per litre.

export const CBS_TABEL = "80416NED";
/** From this day (YYYYMMDD) on: about thirteen months, enough for twelve whole months. */
export const cbsUrl = (vanaf: string) => `https://opendata.cbs.nl/ODataApi/odata/${CBS_TABEL}/TypedDataSet?$filter=Perioden%20ge%20'${vanaf}'`;

export type CbsDag = { Perioden: string; BenzineEuro95_1: number | null; Diesel_2: number | null };
export type Prijzen = { benzinePerLiter: number; dieselPerLiter: number };
export type BrandstofMaand = { maand: string; dagen: number } & Prijzen;
export type BrandstofBestand = {
  gegenereerdOp: string;
  valuta: "EUR";
  inclBtw: true;
  omschrijving: string;
  bron: { naam: string; tabel: string; url: string; licentie: string };
  /** Average of the last 30 days CBS published. */
  laatste: { van: string; tot: string; dagen: number } & Prijzen;
  /** The last (up to) twelve months, oldest first. */
  maanden: BrandstofMaand[];
};

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const datum = (p: string) => `${p.slice(0, 4)}-${p.slice(4, 6)}-${p.slice(6, 8)}`;

/** Days with both prices, oldest first. */
export function leesCbsBrandstof(rijen: CbsDag[]): (Prijzen & { dag: string })[] {
  const uit: (Prijzen & { dag: string })[] = [];
  for (const r of rijen) {
    const p = r.Perioden.trim();
    if (!/^\d{8}$/.test(p) || r.BenzineEuro95_1 == null || r.Diesel_2 == null) continue;
    uit.push({ dag: datum(p), benzinePerLiter: r.BenzineEuro95_1, dieselPerLiter: r.Diesel_2 });
  }
  return uit.sort((a, b) => a.dag.localeCompare(b.dag));
}

const gemiddeld = (d: Prijzen[]): Prijzen => ({
  benzinePerLiter: r3(d.reduce((s, x) => s + x.benzinePerLiter, 0) / d.length),
  dieselPerLiter: r3(d.reduce((s, x) => s + x.dieselPerLiter, 0) / d.length),
});

export function bouwBrandstof(dagen: (Prijzen & { dag: string })[], nu: string): BrandstofBestand {
  if (!dagen.length) throw new Error("brandstof: geen dagen van het CBS");
  for (const d of dagen) {
    for (const [soort, v] of [["benzine", d.benzinePerLiter], ["diesel", d.dieselPerLiter]] as const)
      if (!(v > 0.5 && v < 5)) throw new Error(`brandstof ${d.dag}: ${soort} € ${v} per liter is onmogelijk`);
  }
  const perMaand = new Map<string, Prijzen[]>();
  for (const d of dagen) perMaand.set(d.dag.slice(0, 7), [...(perMaand.get(d.dag.slice(0, 7)) ?? []), d]);
  const maanden = [...perMaand].map(([maand, d]) => ({ maand, dagen: d.length, ...gemiddeld(d) })).slice(-12);
  const laatst = dagen.slice(-30);
  return {
    gegenereerdOp: nu,
    valuta: "EUR",
    inclBtw: true,
    omschrijving: "Gemiddelde pompprijs van benzine (Euro95) en diesel in Nederland (CBS), per liter, incl. btw en accijns: het gemiddelde van de laatste 30 dagen en per maand.",
    bron: {
      naam: "CBS StatLine, Pompprijzen motorbrandstoffen",
      tabel: CBS_TABEL,
      url: `https://opendata.cbs.nl/#/CBS/nl/dataset/${CBS_TABEL}/table`,
      licentie: "CC BY 4.0",
    },
    laatste: { van: laatst[0].dag, tot: laatst[laatst.length - 1].dag, dagen: laatst.length, ...gemiddeld(laatst) },
    maanden,
  };
}
