import test from "node:test";
import assert from "node:assert/strict";
import {
  canResubmitAssignment,
  calculateRubricTotals,
  computeAttemptSnapshot,
  deriveSubmissionStatus,
  isSubmissionLate,
  normalizeAssignmentRubric,
  summarizeAssignmentSubmission,
} from "../services/assignmentService.js";

test("normalizeAssignmentRubric fills in stable rubric ids and ordering", () => {
  const rubric = normalizeAssignmentRubric([{ title: "Research", maxScore: 50 }, { title: "Writing", maxScore: 50 }]);
  assert.equal(rubric[0].rubricId, "1");
  assert.equal(rubric[1].order, 2);
});

test("computeAttemptSnapshot applies late submission status and penalties", () => {
  const assignment = { dueDate: "2026-01-01T00:00:00.000Z", latePenaltyPercent: 10 };
  const snapshot = computeAttemptSnapshot({
    attemptNumber: 2,
    submittedAt: "2026-01-02T00:00:00.000Z",
    assignment,
    rubricScores: [{ rubricId: "1", title: "Research", maxScore: 50, score: 40 }],
  });

  assert.equal(snapshot.isLate, true);
  assert.equal(snapshot.status, "late_submitted");
  assert.equal(snapshot.totalScore, 36);
});

test("deriveSubmissionStatus and rubric totals remain deterministic", () => {
  assert.equal(deriveSubmissionStatus({ graded: true }), "graded");
  assert.deepEqual(calculateRubricTotals([{ score: 10, maxScore: 20 }, { score: 5, maxScore: 10 }]), { totalScore: 15, maxScore: 30 });
});

test("resubmission and summary helpers honor existing attempts", () => {
  assert.equal(canResubmitAssignment({ status: "published", maxAttempts: 2 }, { attemptCount: 1 }), true);
  assert.equal(canResubmitAssignment({ status: "draft", maxAttempts: 2 }, { attemptCount: 1 }), false);

  const summary = summarizeAssignmentSubmission({ status: "graded", attemptCount: 3, totalScore: 88, maxScore: 100, feedback: "Good work" });
  assert.equal(summary.status, "graded");
  assert.equal(summary.attempts, 3);
  assert.equal(summary.feedback, "Good work");
});

test("isSubmissionLate compares timestamps against due dates", () => {
  assert.equal(isSubmissionLate({ dueDate: "2026-01-01T00:00:00.000Z" }, "2026-01-02T00:00:00.000Z"), true);
});