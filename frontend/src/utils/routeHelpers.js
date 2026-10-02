// Route helpers shared by navigation and layouts (FD §4.2, §4.4).

// Main-navigation item (FD §4.4) that a path belongs to, or null when no item is current. Reference content
// (/basics/...) is reached from Vocabulary, so it keeps the Vocabulary item current. Practice, Mixed Practice
// and Review Later are not main-navigation items.
export function navSectionForPath(pathname) {
  if (pathname === "/dashboard") return "/dashboard";
  if (pathname === "/vocabulary" || pathname.startsWith("/vocabulary/") || pathname.startsWith("/basics/")) return "/vocabulary";
  if (pathname === "/grammar" || pathname.startsWith("/grammar/")) return "/grammar";
  if (pathname === "/conjugation" || pathname.startsWith("/conjugation/")) return "/conjugation";
  return null;
}
