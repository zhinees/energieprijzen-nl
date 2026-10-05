// Zonnepanelen: zonnepanelen/zonnepanelen.json → data/zonnepanelen.json (no network).
//
//   node src/zonnepanelen.ts

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DATA, ROOT, schrijfJsonAlsGewijzigd } from "./lib/bestanden.ts";
import { bouwZonnepanelen, type ZonnepanelenConfig } from "./lib/zonnepanelen.ts";

const cfg = JSON.parse(await readFile(join(ROOT, "zonnepanelen", "zonnepanelen.json"), "utf8")) as ZonnepanelenConfig;
const bestand = bouwZonnepanelen(cfg, new Date().toISOString());
const geschreven = await schrijfJsonAlsGewijzigd(join(DATA, "zonnepanelen.json"), bestand);
console.log(`Zonnepanelen: € ${bestand.prijsPerWp.van}–${bestand.prijsPerWp.tot} per Wp (richtwaarde € ${bestand.prijsPerWp.richtwaarde})`);
console.log(geschreven ? "zonnepanelen.json geschreven" : "zonnepanelen.json ongewijzigd");
