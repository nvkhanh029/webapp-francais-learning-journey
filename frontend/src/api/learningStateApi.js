import apiClient from "./apiClient.js";

// Learner state and Review Later (API §13). Learner identity comes from the session, never from the client.

// Records that the learner opened a unit (Continue Learning). No body (API §13.1).
export function openLearningUnit(slug) {
  return apiClient.post(`/me/learning-units/${encodeURIComponent(slug)}/open`);
}

// PATCH semantics: only the supplied fields change, e.g. { learned: true } or { review_later: false } (API §13.2).
export function updateLearningUnitState(slug, state) {
  return apiClient.patch(`/me/learning-units/${encodeURIComponent(slug)}/state`, state);
}

export function getReviewLater() {
  return apiClient.get("/me/review-later");
}
