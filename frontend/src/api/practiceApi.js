import apiClient from "./apiClient.js";

// Practice (API §15-§17). Scoring and correctness stay on the server.

// No body (API §15.1).
export function startNormalPractice(slug) {
  return apiClient.post(`/learning-units/${encodeURIComponent(slug)}/practice/start`);
}

// `options` is the optional request body, e.g. { filters: { modules, question_types } } (API §16.2). Empty by default.
export function startMixedPractice(options = {}) {
  return apiClient.post("/mixed-practice/start", options);
}

// `answers` is the list [{ question_id, answer }] with the answer shape of each question type (API §17.1).
// It is wrapped once here into the request body { answers: [...] }; callers pass the bare list.
export function submitPractice(practiceRunId, answers) {
  return apiClient.post(`/practice/runs/${encodeURIComponent(practiceRunId)}/submit`, { answers });
}
