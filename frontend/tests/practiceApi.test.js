// Run with `npm test` (Node's built-in test runner; no extra dependency).
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { submitPractice } from "../src/api/practiceApi.js";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

// Records the single request and answers with a success envelope.
function stubFetch() {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  return calls;
}

test("submitPractice sends {answers: [...]} wrapped exactly once (API §17.1)", async () => {
  const calls = stubFetch();
  const answers = [
    { question_id: 101, answer: { item_id: 1001 } },
    { question_id: 102, answer: { text: "suis" } },
    { question_id: 103, answer: { item_ids: [1031, 1033, 1032] } },
  ];

  await submitPractice("run-1", answers);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/v1/practice/runs/run-1/submit");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), { answers });
  assert.ok(Array.isArray(JSON.parse(calls[0].init.body).answers), "answers must be a list, not {answers: {answers}}");
});
