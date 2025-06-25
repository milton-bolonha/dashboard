import test from "node:test";
import assert from "node:assert/strict";
import { getPlan, getAddon, getMetadata } from "../lib/plans.js";

test("metadata currency", () => {
  const metadata = getMetadata();
  assert.equal(metadata.currency, "BRL");
});

test("cupido plan exists", () => {
  const cupido = getPlan("cupido");
  assert.ok(cupido);
  assert.equal(cupido.price, 47);
});

test("premium_ai addon", () => {
  const premiumAi = getAddon("premium_ai");
  assert.ok(premiumAi);
  assert.equal(premiumAi.price, 37);
});

console.log("✔ plans helper tests passed");
