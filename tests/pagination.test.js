const test = require("node:test");
const assert = require("node:assert/strict");
const { parsePositiveInteger } = require("../src/utils/pagination");

test("uses the fallback when a query parameter is omitted", () => {
  assert.equal(parsePositiveInteger(undefined, 1, 500), 1);
});

test("accepts valid positive integer strings", () => {
  assert.equal(parsePositiveInteger("12", 1, 500), 12);
});

test("caps values at the configured maximum", () => {
  assert.equal(parsePositiveInteger("9999", 1, 500), 500);
});

test("rejects arrays, objects, decimals, negatives, zero and unsafe integers", () => {
  for (const value of [["2"], { page: "2" }, "1.5", "-1", "0", "9007199254740992", "abc"]) {
    assert.equal(parsePositiveInteger(value, 1, 500), null);
  }
});
