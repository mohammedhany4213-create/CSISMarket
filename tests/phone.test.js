const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeWhatsAppNumber } = require("../src/utils/phone");

test("normalizes Egyptian mobile numbers to international format", () => {
  assert.equal(normalizeWhatsAppNumber("01012345678"), "201012345678");
  assert.equal(normalizeWhatsAppNumber("+20 101 234 5678"), "201012345678");
  assert.equal(normalizeWhatsAppNumber("00201012345678"), "201012345678");
});

test("rejects invalid or unsupported numbers", () => {
  assert.equal(normalizeWhatsAppNumber("12345"), null);
  assert.equal(normalizeWhatsAppNumber(""), null);
  assert.equal(normalizeWhatsAppNumber(null), null);
});
