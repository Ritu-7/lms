import test from "node:test";
import assert from "node:assert/strict";
import { clientDataErrorMessage, isClientDataError, parseObjectId } from "../utils/objectId.js";

test("parseObjectId rejects empty strings instead of treating them as ObjectIds", () => {
  assert.equal(parseObjectId("", "module").error, "module is required");
  assert.equal(parseObjectId(null, "lesson").error, "lesson is required");
  assert.equal(parseObjectId({ _id: "" }, "module").error, "module is required");
});

test("parseObjectId rejects non-ObjectId values", () => {
  assert.equal(parseObjectId("chapter-uniqid", "module").error, "Invalid module");
});

test("parseObjectId accepts a valid ObjectId string", () => {
  const result = parseObjectId("64b5f2c8a1d2e3f4a5b6c7d8", "module");
  assert.equal(result.error, undefined);
  assert.equal(result.id, "64b5f2c8a1d2e3f4a5b6c7d8");
});

test("CastError is treated as a client data error with a clear message", () => {
  const error = { name: "CastError", kind: "ObjectId", path: "module", message: 'Cast to ObjectId failed for value ""' };
  assert.equal(isClientDataError(error), true);
  assert.equal(clientDataErrorMessage(error), "Invalid module");
});
