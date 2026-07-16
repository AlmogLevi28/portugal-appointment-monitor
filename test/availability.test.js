import test from "node:test";
import assert from "node:assert/strict";
import { classifyValue } from "../src/availability.js";

test("classifies supported availability values", () => {
  assert.deepEqual(classifyValue(false), {
    available: false,
    reason: "UNAVAILABLE",
  });
  assert.deepEqual(classifyValue(true), {
    available: true,
    reason: "BOOLEAN_TRUE",
  });
  assert.deepEqual(classifyValue([]), {
    available: false,
    reason: "ARRAY",
  });
  assert.deepEqual(classifyValue(["09:00"]), {
    available: true,
    reason: "ARRAY",
  });
});

test("does not treat arbitrary objects as availability", () => {
  assert.equal(classifyValue({ error: "changed" }).available, false);
  assert.equal(classifyValue({ error: "changed" }).reason, "UNKNOWN_FORMAT");
});
