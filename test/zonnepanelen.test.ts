import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { bouwZonnepanelen, type ZonnepanelenConfig } from "../src/lib/zonnepanelen.ts";

const cfg = JSON.parse(await readFile(new URL("../zonnepanelen/zonnepanelen.json", import.meta.url), "utf8")) as ZonnepanelenConfig;
const nu = "2026-10-05T00:00:00.000Z";

test("neemt de prijs per Wp over, met de datum", () => {
  const b = bouwZonnepanelen(cfg, nu);
  assert.equal(b.valuta, "EUR");
  assert.ok(b.prijsPerWp.richtwaarde >= b.prijsPerWp.van && b.prijsPerWp.richtwaarde <= b.prijsPerWp.tot);
});

test("weigert onmogelijke waarden", () => {
  const met = (wijzig: (c: ZonnepanelenConfig) => void) => () => { const c = structuredClone(cfg); wijzig(c); return bouwZonnepanelen(c, nu); };
  assert.throws(met((c) => { c.prijsPerWp = { richtwaarde: 1, van: 2, tot: 1 }; }), /'van' moet/);
  assert.throws(met((c) => { c.prijsPerWp.richtwaarde = 3; }), /binnen de bandbreedte/);
  assert.throws(met((c) => { c.prijsPerWp = { richtwaarde: 900, van: 600, tot: 1000 }; }), /per Wp/);
  assert.throws(met((c) => { c.bronnen = []; }), /minstens één bron/);
  assert.throws(met((c) => { c.bronnen[0].datum = "2099-01-01"; }), /na gecontroleerdOp/);
});
