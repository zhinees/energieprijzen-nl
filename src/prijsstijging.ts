// Prijsstijging: prijsstijging/prijsstijging.json → data/prijsstijging.json (no network).
//
//   node src/prijsstijging.ts

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DATA, ROOT, schrijfJsonAlsGewijzigd } from "./lib/bestanden.ts";
import { bouwPrijsstijging, type PrijsstijgingConfig } from "./lib/prijsstijging.ts";

const cfg = JSON.parse(await readFile(join(ROOT, "prijsstijging", "prijsstijging.json"), "utf8")) as PrijsstijgingConfig;
const bestand = bouwPrijsstijging(cfg, new Date().toISOString());
const geschreven = await schrijfJsonAlsGewijzigd(join(DATA, "prijsstijging.json"), bestand);
console.log(`Standaard: ${bestand.standaard.procentPerJaar}% per jaar (${bestand.standaard.bron}): ${bestand.standaard.berekening}`);
console.log(geschreven ? "prijsstijging.json geschreven" : "prijsstijging.json ongewijzigd");
