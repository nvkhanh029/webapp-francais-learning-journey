import apiClient from "./apiClient.js";

// Dashboard (API §8).

export function getDashboard() {
  return apiClient.get("/me/dashboard");
}

// Unique active dates of one month: { year, month, days: ["YYYY-MM-DD", ...] } (API §8.2).
export function getActivityCalendar(year, month) {
  return apiClient.get("/me/activity-calendar", { year, month });
}
