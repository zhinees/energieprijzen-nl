import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { bouwBrandstof, leesCbsBrandstof, type CbsDag } from "../src/lib/brandstof.ts";

const rijen = (JSON.parse(await readFile(new URL("./fixtures/cbs-80416NED.json", import.meta.url), "utf8")) as { value: CbsDag[] }).value;

test("gemiddelde van de laatste 30 dagen en per maand", () => {
  const b = bouwBrandstof(leesCbsBrandstof(rijen), "2026-10-01T00:00:00.000Z");
  assert.equal(b.laatste.dagen, 30);
  assert.equal(b.laatste.tot, "2026-09-28");
  assert.equal(b.laatste.van, "2026-08-30");
  assert.deepEqual(b.maanden.map((m) => [m.maand, m.dagen]), [["2026-08", 31], ["2026-09", 28]]);
  assert.ok(b.laatste.benzinePerLiter > 2.3 && b.laatste.benzinePerLiter < 2.5);
});

test("slaat dagen zonder prijs over en weigert onmogelijke prijzen", () => {
  assert.equal(leesCbsBrandstof([{ Perioden: "20260101", BenzineEuro95_1: null, Diesel_2: 2 }]).length, 0);
  assert.throws(() => bouwBrandstof([], "x"), /geen dagen/);
  assert.throws(() => bouwBrandstof([{ dag: "2026-01-01", benzinePerLiter: 2400, dieselPerLiter: 2.4 }], "x"), /onmogelijk/);
});
