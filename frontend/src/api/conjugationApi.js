import apiClient from "./apiClient.js";

// Verb Conjugation content (API §11).

export function getConjugation() {
  return apiClient.get("/conjugation");
}

export function getConjugationLesson(slug) {
  return apiClient.get(`/conjugation/lessons/${encodeURIComponent(slug)}`);
}
