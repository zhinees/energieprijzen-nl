import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { bouwPrijsstijging, type PrijsstijgingConfig } from "../src/lib/prijsstijging.ts";

const cfg = JSON.parse(await readFile(new URL("../prijsstijging/prijsstijging.json", import.meta.url), "utf8")) as PrijsstijgingConfig;
const nu = "2026-10-05T00:00:00.000Z";

test("eerst PBL, met de inflatie van CPB naar lopende prijzen", () => {
  const c = structuredClone(cfg);
  c.pbl!.groothandelsprijsPerMWh = { vanJaar: 2024, van: 100, naarJaar: 2026, naar: 100 };
  c.cpb!.inflatieCpi = { "2027": 2 };
  const b = bouwPrijsstijging(c, nu);
  assert.equal(b.standaard.bron, "pbl");
  assert.equal(b.standaard.procentPerJaar, 2);
  assert.equal(b.gegenereerdOp, nu);
});

test("PBL zonder CPB: alleen de groothandelsprijs", () => {
  const c = structuredClone(cfg);
  delete c.cpb;
  c.pbl!.groothandelsprijsPerMWh = { vanJaar: 2024, van: 100, naarJaar: 2025, naar: 95 };
  assert.deepEqual([bouwPrijsstijging(c, nu).standaard.bron, bouwPrijsstijging(c, nu).standaard.procentPerJaar], ["pbl", -5]);
});

test("zonder PBL de inflatie van CPB (laatste jaar), zonder beide de terugval", () => {
  const c = structuredClone(cfg);
  delete c.pbl;
  c.cpb!.inflatieCpi = { "2026": 3.3, "2027": 2.7 };
  assert.deepEqual(bouwPrijsstijging(c, nu).standaard.procentPerJaar, 2.7);
  delete c.cpb;
  assert.deepEqual([bouwPrijsstijging(c, nu).standaard.bron, bouwPrijsstijging(c, nu).standaard.procentPerJaar], ["terugval", 10]);
});

test("weigert onmogelijke waarden", () => {
  const met = (wijzig: (c: PrijsstijgingConfig) => void) => () => { const c = structuredClone(cfg); wijzig(c); return bouwPrijsstijging(c, nu); };
  assert.throws(met((c) => { c.pbl!.groothandelsprijsPerMWh.naarJaar = 2020; }), /onmogelijk/);
  assert.throws(met((c) => { c.pbl!.groothandelsprijsPerMWh.van = 7700; }), /per MWh/);
  assert.throws(met((c) => { c.cpb!.inflatieCpi = { "2027": 27 }; }), /inflatie/);
  assert.throws(met((c) => { c.pbl!.datum = "2099-01-01"; }), /na gecontroleerdOp/);
});

test("gas en brandstof: dezelfde volgorde, met een eigen PBL-reeks", () => {
  const c = structuredClone(cfg);
  c.cpb!.inflatieCpi = { "2027": 2 };
  c.dragers = { gas: { omschrijving: "gas", pbl: { publicatie: "KEV", url: "https://www.pbl.nl/", datum: "2026-10-01", tabel: "7b", prijspeil: 2025, prijs: { eenheid: "€/MWh", vanJaar: 2025, van: 40, naarJaar: 2026, naar: 40 } } } };
  const b = bouwPrijsstijging(c, nu);
  assert.deepEqual([b.perDrager.gas.bron, b.perDrager.gas.procentPerJaar], ["pbl", 2]);
  assert.deepEqual([b.perDrager.brandstof.bron, b.perDrager.brandstof.procentPerJaar], ["cpb", 2]);
  // De stroom blijft zoals hij was.
  assert.equal(b.standaard.bron, "pbl");
  delete c.cpb; delete c.dragers;
  assert.deepEqual(bouwPrijsstijging(c, nu).perDrager.gas.bron, "terugval");
});
