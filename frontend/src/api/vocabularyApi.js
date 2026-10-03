import apiClient from "./apiClient.js";

// Vocabulary content (API §10).

export function getVocabulary() {
  return apiClient.get("/vocabulary");
}

export function getVocabularyTopic(topicSlug) {
  return apiClient.get(`/vocabulary/topics/${encodeURIComponent(topicSlug)}`);
}

export function getVocabularyStudyUnit(slug) {
  return apiClient.get(`/vocabulary/study-units/${encodeURIComponent(slug)}`);
}
