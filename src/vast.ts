// Average fixed contract (CBS) → data/vast.json (electricity) and data/gas.json (gas), from one request.
//
//   node src/vast.ts   # fetch CBS StatLine 85592NED; on failure keep data/vast.json and data/gas.json as they are

import { join } from "node:path";
import { DATA, schrijfJsonAlsGewijzigd } from "./lib/bestanden.ts";
import { CBS_URL, bouwVast, leesCbs, type CbsRij } from "./lib/vast.ts";
import { bouwGas, leesCbsGas } from "./lib/gas.ts";

try {
  const antwoord = await fetch(CBS_URL, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
  if (!antwoord.ok) throw new Error(`CBS: HTTP ${antwoord.status}`);
  const { value } = (await antwoord.json()) as { value: CbsRij[] };
  const bestand = bouwVast(leesCbs(value), new Date().toISOString());
  const geschreven = await schrijfJsonAlsGewijzigd(join(DATA, "vast.json"), bestand);
  const l = bestand.laatste;
  console.log(`vast (CBS ${l.maand}): € ${l.totaalPerKwh}/kWh incl. energiebelasting, € ${l.vastPerMaand}/maand`);
  console.log(geschreven ? "vast.json geschreven" : "vast.json ongewijzigd");
  try {
    const gas = bouwGas(leesCbsGas(value), new Date().toISOString());
    const g = gas.laatste;
    console.log(`gas (CBS ${g.maand}): € ${g.totaalPerM3}/m³ incl. energiebelasting, vast € ${g.vastPerJaar}/jaar, netbeheer € ${g.netbeheerPerJaar}/jaar`);
    console.log((await schrijfJsonAlsGewijzigd(join(DATA, "gas.json"), gas)) ? "gas.json geschreven" : "gas.json ongewijzigd");
  } catch (e) {
    console.error(`gas: FOUT ${(e as Error).message} (data/gas.json blijft zoals hij was)`);
  }
} catch (e) {
  // CBS unreachable or changed: the previous file stays, the other data still gets updated.
  console.error(`vast: FOUT ${(e as Error).message} (data/vast.json en data/gas.json blijven zoals ze waren)`);
}
