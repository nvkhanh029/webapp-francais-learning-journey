import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// A router navigation to another page starts at the top of that page. Not applied to:
// - Back/Forward (POP): the browser keeps restoring the previous scroll position;
// - hash-only changes and URLs with a hash (e.g. Grammar #lesson-<slug>): the page scrolls to its target itself.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === "POP" || hash) return;
    window.scrollTo(0, 0);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
