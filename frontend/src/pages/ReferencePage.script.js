// Behavior carried over from the raw UI prototype (reference.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by ReferencePage.jsx.
export default function init() {
  // UI preview only. No fetching, authentication, or routing is added here.
  // Production components receive this data from GET /api/v1/references/{slug} (API Contract §12.1).
  (() => {
      const isEnglish = document.documentElement.lang.startsWith("en");
      const preview = new URLSearchParams(window.location.search).get("preview");

      // Fixed copy used by the script; production copy lives in the i18n dictionaries.
      const COPY = isEnglish
          ? {
              pageTitle: (title) => `Français Learning Journey | ${title}`,
              menuOpen: "Close navigation menu",
              menuClosed: "Navigation menu",
          }
          : {
              pageTitle: (title) => `Français Learning Journey | ${title}`,
              menuOpen: "Đóng menu điều hướng",
              menuClosed: "Menu điều hướng",
          };

      // Sample responses in the shape of GET /api/v1/references/{slug}: exactly four fields.
      // `content` is one localized Markdown string (truncated here); its rendered HTML is in
      // the templates above.
      const SAMPLE_REFERENCE = {
          slug: "french-alphabet-accents",
          title_fr: "Alphabet français et accents",
          title: "Bảng chữ cái và dấu trong tiếng Pháp",
          content: "Tiếng Pháp dùng bảng chữ cái Latinh gồm **26 chữ cái**…\n\n## Bảng chữ cái\n…",
      };

      // Layout check only: not a real reference.
      const SAMPLE_ALT_REFERENCE = {
          slug: "alt-sample",
          title_fr: "Les nombres de 0 à 5",
          // No localized title yet: the backend falls back to title_fr (API §4.9).
          title: "Les nombres de 0 à 5",
          content: "Dùng bảng này để tra nhanh các số từ 0 đến 5…",
      };

      /* ---------- Helpers ---------- */
      const article = document.querySelector("[data-reference-content]");
      const pageStates = document.querySelectorAll("[data-page-state]");
      const currentCrumb = document.querySelector('[data-crumb="current"]');

      function slot(root, name) {
          return root.querySelector(`[data-slot="${name}"]`);
      }

      // French title is primary (lang="fr"); the localized title supports it. When the API has
      // fallen back to title_fr (API §4.9), the support line is hidden rather than repeated.
      function setTitles(primary, support, item) {
          primary.textContent = item.title_fr || item.title;
          if (item.title_fr) primary.setAttribute("lang", "fr");
          else primary.removeAttribute("lang");
          const hasSupport = Boolean(item.title_fr && item.title && item.title !== item.title_fr);
          support.hidden = !hasSupport;
          support.textContent = hasSupport ? item.title : "";
      }

      /* ---------- Reference ---------- */
      function renderReference(reference, contentTemplateId) {
          document.title = COPY.pageTitle(reference.title_fr || reference.title);
          setTitles(slot(article, "title"), slot(article, "support"), reference);

          const crumbTitle = slot(currentCrumb, "crumb-title");
          crumbTitle.textContent = reference.title_fr || reference.title;

          slot(article, "content").replaceChildren(
              document.getElementById(contentTemplateId).content.cloneNode(true)
          );
          // No learner-state call of any kind: reference pages are not learning units.
      }

      /* ---------- Page states ---------- */
      function showPageState(stateName) {
          pageStates.forEach((element) => {
              element.hidden = element.dataset.pageState !== stateName;
          });
          article.hidden = stateName !== "content";
          // Without reference data only the Vocabulary crumb is known.
          currentCrumb.hidden = stateName !== "content";
      }

      function showSample() {
          if (preview === "alt-content") {
              renderReference(SAMPLE_ALT_REFERENCE, "content-alt-reference");
          } else {
              renderReference(SAMPLE_REFERENCE, "content-french-alphabet-accents");
          }
          showPageState("content");
      }

      if (preview === "loading") {
          showPageState("loading");
      } else if (preview === "error") {
          showPageState("error");
      } else {
          showSample();
      }
      document.querySelector('[data-action="retry"]').addEventListener("click", showSample);

      /* ---------- Compact navigation menu (same behavior as Dashboard, FD §8.5) ---------- */
      const menuButton = document.querySelector(".menu-button");
      const mobileNav = document.getElementById("mobile-nav");
      const menuIcon = menuButton.querySelector(".material-symbols-outlined");

      function setMenu(open) {
          menuButton.setAttribute("aria-expanded", String(open));
          menuButton.setAttribute("aria-label", open ? COPY.menuOpen : COPY.menuClosed);
          menuIcon.textContent = open ? "close" : "menu";
          mobileNav.hidden = !open;
      }

      menuButton.addEventListener("click", () => setMenu(mobileNav.hidden));
      mobileNav.addEventListener("click", (event) => {
          if (event.target.closest("a")) setMenu(false);
      });
      document.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && !mobileNav.hidden) {
              setMenu(false);
              menuButton.focus();
          }
      });
      window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
          if (event.matches) setMenu(false);
      });
  })();

}
