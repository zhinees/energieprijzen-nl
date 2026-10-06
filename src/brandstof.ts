// Pump prices (CBS) → data/brandstof.json.
//
//   node src/brandstof.ts   # fetch CBS StatLine 80416NED; on failure keep data/brandstof.json as it is

import { join } from "node:path";
import { DATA, schrijfJsonAlsGewijzigd } from "./lib/bestanden.ts";
import { bouwBrandstof, cbsUrl, leesCbsBrandstof, type CbsDag } from "./lib/brandstof.ts";

try {
  const van = new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10).replaceAll("-", "");
  const antwoord = await fetch(cbsUrl(van), { headers: { accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
  if (!antwoord.ok) throw new Error(`CBS: HTTP ${antwoord.status}`);
  const { value } = (await antwoord.json()) as { value: CbsDag[] };
  const bestand = bouwBrandstof(leesCbsBrandstof(value), new Date().toISOString());
  const l = bestand.laatste;
  console.log(`brandstof (CBS ${l.van} t/m ${l.tot}): benzine € ${l.benzinePerLiter}, diesel € ${l.dieselPerLiter} per liter`);
  console.log((await schrijfJsonAlsGewijzigd(join(DATA, "brandstof.json"), bestand)) ? "brandstof.json geschreven" : "brandstof.json ongewijzigd");
} catch (e) {
  console.error(`brandstof: FOUT ${(e as Error).message} (data/brandstof.json blijft zoals hij was)`);
}
