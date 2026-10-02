import apiClient from "./apiClient.js";

// Reference content such as Alphabet & Accents (API §12).

export function getReferences() {
  return apiClient.get("/references");
}

export function getReference(slug) {
  return apiClient.get(`/references/${encodeURIComponent(slug)}`);
}
