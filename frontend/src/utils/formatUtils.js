// Pure display derivations (FD §5.2, FD §7.7).
//
// These are presentation-only. The backend remains authoritative for the underlying counts
// (`progress.*.learned/total`, `correct_count`, `total_questions`); nothing here is treated as
// trusted state and nothing here replaces a backend rule (FD §3.3, API §23).

// Module progress percentage: floor(learned / total x 100), clamped to 0-100, so "100%" appears
// only when every unit is learned. Progress is floored, never rounded (FD §7.7). A total of 0
// (or a missing value) shows 0% rather than NaN.
export function modulePercent(learned, total) {
  if (!Number.isFinite(learned) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.floor((learned * 100) / total)));
}

// Practice accuracy for display: rounded to a whole percent, unlike module progress (FD §7.7).
export function accuracyPercent(correct, total) {
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((correct * 100) / total)));
}
