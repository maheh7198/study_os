import assert from "node:assert/strict";
import { normalizeHttpError } from "./httpErrors.js";

const cases = [
  [101, "informational"], [200, "success"], [201, "success"], [301, "redirect"], [304, "redirect"], [307, "redirect"], [400, "client"],
  [401, "client"], [403, "client"], [404, "client"], [409, "client"],
  [422, "client"], [429, "client"], [500, "server"], [503, "server"],
];
for (const [status, category] of cases) {
  assert.equal(normalizeHttpError({ status }).category, category, `status ${status}`);
}
assert.equal(normalizeHttpError({ status: 401, request: "login" }).message, "Incorrect email or password.");
assert.equal(normalizeHttpError({ status: 409, request: "register" }).message, "An account with this email already exists.");
assert.equal(normalizeHttpError({ status: 408 }).retryable, true);
assert.equal(normalizeHttpError({ status: 429, headers: new Headers({ "Retry-After": "7" }) }).retryAfterSeconds, 7);
assert.equal(normalizeHttpError({ status: 422, body: { errors: { email: "Invalid email" } } }).fieldErrors.email, "Invalid email");
assert.equal(normalizeHttpError({ error: new Error("The request timed out."), timeout: true }).status, 408);
assert.equal(normalizeHttpError({ error: new TypeError("Failed to fetch") }).retryable, true);
assert.equal(normalizeHttpError({ error: new Error("timeout"), online: false }).category, "network");
console.log("HTTP error mapper checks passed: 200, 201, 304, 400, 401, 403, 404, 409, 422, 429, 500, 503, Retry-After, field errors, timeout/network.");
