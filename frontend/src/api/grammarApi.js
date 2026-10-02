import apiClient from "./apiClient.js";

// Grammar content (API §9).

export function getGrammar() {
  return apiClient.get("/grammar");
}

export function getGrammarLesson(slug) {
  return apiClient.get(`/grammar/lessons/${encodeURIComponent(slug)}`);
}
