import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { bouwGas, leesCbsGas } from "../src/lib/gas.ts";
import type { CbsRij } from "../src/lib/vast.ts";

const rijen = (JSON.parse(await readFile(new URL("./fixtures/cbs-85592NED.json", import.meta.url), "utf8")) as { value: CbsRij[] }).value;

test("leest de gasprijzen per maand incl. btw uit dezelfde CBS-tabel als stroom", () => {
  const aug = leesCbsGas(rijen).find((x) => x.maand === "2026-08")!;
  assert.equal(aug.leveringPerM3, 0.6526);
  assert.equal(aug.energiebelastingPerM3, 0.7268);
  assert.equal(aug.totaalPerM3, 1.3794);
  assert.equal(aug.vastPerJaar, 92.95);
  assert.equal(aug.netbeheerPerJaar, 268.37);
});

test("slaat rijen zonder gas, excl. btw en jaartotalen over", () => {
  const extra = [...rijen, { ...rijen[0], Perioden: "2026JJ00" }, { ...rijen[0], Btw: "A048945" }, { ...rijen[0], Perioden: "2026MM09", Energiebelasting_6: null }];
  const b = bouwGas(leesCbsGas(extra), "2026-10-01T00:00:00.000Z");
  assert.equal(b.laatste.maand, "2026-08");
  assert.ok(b.maanden.length <= 12);
});

test("weigert onmogelijke waarden", () => {
  assert.throws(() => bouwGas([], "x"), /geen maanden/);
  const m = leesCbsGas(rijen);
  assert.throws(() => bouwGas([{ ...m[0], leveringPerM3: 65 }], "x"), /onmogelijk/);
  assert.throws(() => bouwGas([{ ...m[0], netbeheerPerJaar: 26837 }], "x"), /onmogelijk/);
});
