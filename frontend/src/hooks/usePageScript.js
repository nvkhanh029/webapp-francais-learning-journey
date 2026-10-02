import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Runs a page's companion script (<Page>.script.js) against the DOM that the page renders, and turns
// in-page links into React Router navigation. Raw-UI prototype behavior only: no data fetching here.
const registry = new WeakMap();

// Records every listener the script registers so a real unmount can remove them again.
function runTracked(init) {
  const records = [];
  const original = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function addTracked(type, listener, options) {
    records.push([this, type, listener, options]);
    return original.call(this, type, listener, options);
  };
  try {
    init();
  } finally {
    EventTarget.prototype.addEventListener = original;
  }
  return () => records.forEach(([target, type, listener, options]) => target.removeEventListener(type, listener, options));
}

export default function usePageScript(init, { title, lang } = {}) {
  const rootRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const previous = { title: document.title, lang: document.documentElement.lang };
    if (title) document.title = title;
    if (lang) document.documentElement.lang = lang;
    return () => {
      document.title = previous.title;
      document.documentElement.lang = previous.lang;
    };
  }, [title, lang]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !init) return undefined;
    // StrictMode mounts, unmounts and re-mounts in development: run the script once per DOM element and
    // only tear it down when the element has really left the document.
    let cleanup = registry.get(el);
    if (!cleanup) {
      cleanup = runTracked(init);
      registry.set(el, cleanup);
    }
    return () => {
      window.setTimeout(() => {
        if (!el.isConnected) {
          cleanup();
          registry.delete(el);
        }
      }, 0);
    };
  }, [init]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target.closest("a[href], [data-route]");
      if (!target || !el.contains(target) || target.getAttribute("aria-disabled") === "true") return;
      const href = target.getAttribute("href");
      if (href && href.startsWith("/")) {
        event.preventDefault();
        navigate(href);
      } else if (target.dataset.route) {
        event.preventDefault();
        navigate(target.dataset.route);
      } else if (href === "#") {
        event.preventDefault();
      }
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [navigate]);

  return rootRef;
}
