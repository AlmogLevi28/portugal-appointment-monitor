import test from "node:test";
import assert from "node:assert/strict";
import { isNewAvailability, markAvailabilityAsSeen } from "../src/state.js";

const opening = [{ date: "2026-08-25", value: true, reason: "BOOLEAN_TRUE" }];

test("an unchanged opening is not reported twice", () => {
  const state = { lastAvailabilityHash: null, lastAvailabilitySummary: [] };
  assert.equal(isNewAvailability(state, opening), true);
  markAvailabilityAsSeen(state, opening);
  assert.equal(isNewAvailability(state, opening), false);
});

test("the same opening is new after an empty successful check", () => {
  const state = { lastAvailabilityHash: null, lastAvailabilitySummary: [] };
  markAvailabilityAsSeen(state, opening);
  markAvailabilityAsSeen(state, []);
  assert.equal(state.lastAvailabilityHash, null);
  assert.equal(isNewAvailability(state, opening), true);
});
