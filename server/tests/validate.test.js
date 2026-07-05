import test from "node:test";
import assert from "node:assert/strict";
import { requireFields, validateObjectIdParam, validateRating } from "../middlewares/validate.js";
import { AppError } from "../utils/AppError.js";

test("requireFields returns a validation error when required fields are missing", () => {
  const errors = [];
  const middleware = requireFields("courseId", "rating");

  middleware({ body: { courseId: "abc" } }, {}, (error) => errors.push(error));

  assert.equal(errors.length, 1);
  assert.ok(errors[0] instanceof AppError);
  assert.equal(errors[0].statusCode, 400);
  assert.deepEqual(errors[0].details, { missing: ["rating"] });
});

test("validateObjectIdParam rejects invalid ids", () => {
  const errors = [];

  validateObjectIdParam("courseId")({ params: { courseId: "not-an-id" } }, {}, (error) => errors.push(error));

  assert.equal(errors.length, 1);
  assert.ok(errors[0] instanceof AppError);
  assert.equal(errors[0].message, "Invalid courseId");
});

test("validateRating coerces a valid rating to a number", () => {
  const req = { body: { rating: "4" } };
  let called = false;

  validateRating(req, {}, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(req.body.rating, 4);
});

test("validateRating rejects values outside the accepted range", () => {
  const errors = [];

  validateRating({ body: { rating: 6 } }, {}, (error) => errors.push(error));

  assert.equal(errors.length, 1);
  assert.ok(errors[0] instanceof AppError);
  assert.equal(errors[0].message, "Rating must be an integer from 1 to 5");
});
