const test = require("node:test");
const assert = require("node:assert/strict");
const { isAllowedStudentEmail } = require("../src/utils/studentEmail");

test("allows only configured campus domains", () => {
  assert.equal(isAllowedStudentEmail("student@cs.example.edu", "cs.example.edu, example.edu"), true);
  assert.equal(isAllowedStudentEmail("student@gmail.com", "cs.example.edu, example.edu"), false);
});

test("does not enforce a domain until the institution configures one", () => {
  assert.equal(isAllowedStudentEmail("student@gmail.com", ""), true);
});
