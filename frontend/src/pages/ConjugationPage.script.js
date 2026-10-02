// Behavior carried over from the raw UI prototype (conjugation-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by ConjugationPage.jsx.
import { t } from "../i18n/index.js";

export default function init({ onLanguageChange } = {}) {
  // UI preview only. No fetching, authentication, or routing is added here.
  // Production components receive this data from GET /api/v1/conjugation.
  (() => {
      const preview = new URLSearchParams(window.location.search).get("preview");

      // Sample response in the shape of GET /api/v1/conjugation. Titles are sample curriculum
      // data, not the final curriculum; the layout must not depend on these titles or counts.
      const SAMPLE_CONJUGATION = {
          tenses: [
              {
                  title_fr: "Le présent de l'indicatif",
                  title: "Thì hiện tại",
                  lessons: [
                      { slug: "present-regular-er", title_fr: "Les verbes réguliers en -ER", title: "Động từ có quy tắc đuôi -ER", learned: true, review_later: false },
                      { slug: "present-regular-ir", title_fr: "Les verbes réguliers en -IR", title: "Động từ có quy tắc đuôi -IR", learned: true, review_later: false },
                      { slug: "present-regular-re", title_fr: "Les verbes réguliers en -RE", title: "Động từ có quy tắc đuôi -RE", learned: false, review_later: true },
                      { slug: "present-spelling-changes", title_fr: "Les verbes en -ER avec changements orthographiques : -cer, -ger, -yer, e/é + consonne", title: "Động từ đuôi -ER có biến đổi chính tả: -cer, -ger, -yer, e/é + phụ âm", learned: true, review_later: true },
                      { slug: "present-irregular-patterns", title_fr: "Les verbes irréguliers fréquents", title: "Các động từ bất quy tắc thông dụng", learned: false, review_later: false },
                  ],
              },
              {
                  title_fr: "Le passé composé",
                  title: "Thì quá khứ kép",
                  lessons: [
                      { slug: "passe-compose-avoir", title_fr: "La formation avec l'auxiliaire avoir", title: "Cách thành lập với trợ động từ avoir", learned: true, review_later: false },
                      { slug: "passe-compose-etre", title_fr: "La formation avec l'auxiliaire être", title: "Cách thành lập với trợ động từ être", learned: true, review_later: true },
                      { slug: "passe-compose-accord", title_fr: "L'accord du participe passé", title: "Sự hợp giống và số của quá khứ phân từ", learned: false, review_later: false },
                  ],
              },
              {
                  title_fr: "L'imparfait",
                  title: "Thì quá khứ chưa hoàn thành",
                  lessons: [
                      { slug: "imparfait-formation", title_fr: "La formation de l'imparfait", title: "Cách thành lập thì imparfait", learned: true, review_later: false },
                      { slug: "imparfait-passe-compose", title_fr: "L'imparfait et le passé composé", title: "Phân biệt imparfait và passé composé", learned: false, review_later: true },
                  ],
              },
              {
                  title_fr: "Le futur simple",
                  title: "Thì tương lai đơn",
                  lessons: [
                      { slug: "futur-simple-formation", title_fr: "La formation du futur simple", title: "Cách thành lập thì futur simple", learned: false, review_later: false },
                      { slug: "futur-simple-irregular-stems", title_fr: "Les radicaux irréguliers du futur simple", title: "Gốc bất quy tắc của futur simple", learned: false, review_later: false },
                      // No localized title yet: the backend falls back to title_fr.
                      { slug: "futur-simple-futur-proche", title_fr: "Futur simple ou futur proche ?", title: "Futur simple ou futur proche ?", learned: false, review_later: false },
                  ],
              },
          ],
      };

      /* ---------- Rendering helpers ---------- */
      function slot(root, name) {
          return root.querySelector(`[data-slot="${name}"]`);
      }

      function fromTemplate(id) {
          return document.getElementById(id).content.firstElementChild.cloneNode(true);
      }

      // French is the target language: title_fr is the primary title (lang="fr") and the
      // localized title sits underneath as support. When the API has fallen back to
      // title_fr for a missing translation, the support line is omitted.
      function setTitles(primaryElement, supportElement, item) {
          primaryElement.textContent = item.title_fr || item.title;
          if (!item.title_fr) primaryElement.removeAttribute("lang");
          if (!item.title_fr || !item.title || item.title === item.title_fr) {
              supportElement.remove();
          } else {
              supportElement.textContent = item.title;
          }
      }

      // Keep displayed text, aria-valuenow, and --progress equal.
      function setProgress(track, percentElement, learned, total) {
          // Floor with integer math and clamp to 0-100: "100%" appears only when every unit is learned.
          const percent = total > 0 ? Math.min(100, Math.max(0, Math.floor((learned * 100) / total))) : 0;
          percentElement.textContent = `${percent}%`;
          track.setAttribute("aria-valuenow", String(percent));
          track.style.setProperty("--progress", `${percent}%`);
      }

      // Review Later has priority for the row's status icon; learned is next. In a dual-state
      // lesson the learned badge becomes the quiet outline variant.
      function renderLesson(lesson) {
          const item = fromTemplate("lesson-template");
          const link = slot(item, "link");
          link.dataset.route = `/conjugation/lessons/${lesson.slug}`;
          link.classList.toggle("is-learned", lesson.learned);
          link.classList.toggle("is-saved", lesson.review_later);
          slot(item, "status").textContent =
              lesson.learned ? "check_circle" : "radio_button_unchecked";
          setTitles(slot(item, "title"), slot(item, "support"), lesson);
          slot(item, "learned").hidden = !lesson.learned;
          slot(item, "learned").classList.toggle("badge-quiet", lesson.learned && lesson.review_later);
          slot(item, "review-later").hidden = !lesson.review_later;
          slot(item, "meta").hidden = !lesson.learned && !lesson.review_later;
          return item;
      }

      function renderTense(tense, index) {
          const section = fromTemplate("tense-template");
          const lessons = tense.lessons || [];
          const learned = lessons.filter((lesson) => lesson.learned).length;
          const button = slot(section, "button");
          const body = slot(section, "body");
          const titleId = `tense-${index + 1}-title`;
          const bodyId = `tense-${index + 1}-lessons`;

          section.setAttribute("aria-labelledby", titleId);
          section.querySelector(".tense-heading").id = titleId;
          body.id = bodyId;
          button.setAttribute("aria-controls", bodyId);
          setTitles(slot(section, "title"), slot(section, "support"), tense);
          slot(section, "count").textContent = t("common.lessonsOf", { learned, total: lessons.length, n: lessons.length });
          const list = slot(section, "lessons");
          list.append(...lessons.map(renderLesson));
          list.hidden = lessons.length === 0;
          slot(section, "empty").hidden = lessons.length > 0;
          return section;
      }

      /* ---------- Page states ---------- */
      const content = document.querySelector("[data-conjugation-content]");
      const overview = document.querySelector("[data-overview]");
      const tenseList = document.querySelector("[data-tense-list]");
      const pageStates = document.querySelectorAll("[data-page-state]");

      function showPageState(state) {
          pageStates.forEach((element) => {
              element.hidden = element.dataset.pageState !== state;
          });
          content.hidden = state !== "content";
          overview.hidden = state !== "content";
      }

      let currentData = null;

      function render(data, { restore = true } = {}) {
          currentData = data;
          const tenses = data.tenses || [];
          const lessons = tenses.flatMap((tense) => tense.lessons || []);
          if (tenses.length === 0 || lessons.length === 0) {
              showPageState("empty");
              return;
          }
          const learned = lessons.filter((lesson) => lesson.learned).length;

          setProgress(slot(overview, "track"), slot(overview, "percent"), learned, lessons.length);
          slot(overview, "count").textContent = t("common.lessonsOf", { learned, total: lessons.length, n: lessons.length });
          slot(overview, "review-count").textContent =
              t("common.lessonsN", { n: lessons.filter((lesson) => lesson.review_later).length });
          overview.classList.toggle("is-complete", learned === lessons.length);
          document.querySelector("[data-summary]").replaceChildren(
              ...[
                  t("conj.tensesCount", { n: tenses.length }),
                  t("common.lessonsN", { n: lessons.length }),
              ].map((text) => {
                  const chip = document.createElement("li");
                  chip.className = "badge badge-info";
                  chip.textContent = text;
                  return chip;
              })
          );
          tenseList.replaceChildren(...tenses.map(renderTense));
          updateToggleAll();
          showPageState("content");
          // Conjugation data is now in the DOM: if we arrived from a lesson's "back" link,
          // restore that lesson's place on the page.
          if (restore) restoreLessonContext();
      }

      /* ---------- Open / close Tenses (frontend-only UI state, no request) ---------- */
      const toggleAll = document.querySelector('[data-action="toggle-all"]');

      function tenseButtons() {
          return Array.from(tenseList.querySelectorAll(".tense-summary"));
      }

      function setTenseOpen(button, open) {
          button.setAttribute("aria-expanded", String(open));
          document.getElementById(button.getAttribute("aria-controls")).hidden = !open;
      }

      function updateToggleAll() {
          const anyOpen = tenseButtons().some((button) => button.getAttribute("aria-expanded") === "true");
          slot(toggleAll, "label").textContent = t(anyOpen ? "common.collapseAll" : "common.expandAll");
          slot(toggleAll, "icon").textContent = anyOpen ? "unfold_less" : "unfold_more";
      }

      tenseList.addEventListener("click", (event) => {
          const button = event.target.closest(".tense-summary");
          if (!button) return;
          setTenseOpen(button, button.getAttribute("aria-expanded") !== "true");
          updateToggleAll();
      });

      toggleAll.addEventListener("click", () => {
          const buttons = tenseButtons();
          const open = !buttons.some((button) => button.getAttribute("aria-expanded") === "true");
          buttons.forEach((button) => setTenseOpen(button, open));
          updateToggleAll();
      });

      /* ---------- Return-from-lesson context restore ----------
         Triggered by a URL hash of the form #lesson-<slug> (the slug already comes from
         GET /api/v1/conjugation). Reading it from the URL means a direct load or refresh
         on that hash still works. */
      const liveRegion = document.querySelector("[data-live-region]");

      function restoreLessonContext() {
          const match = /^#lesson-(.+)$/.exec(window.location.hash);
          if (!match) return;
          let slug;
          try {
              slug = decodeURIComponent(match[1]);
          } catch {
              slug = match[1];
          }
          const escapedSlug = window.CSS && CSS.escape ? CSS.escape(slug) : slug;
          const link = tenseList.querySelector(`[data-route="/conjugation/lessons/${escapedSlug}"]`);
          if (!link) return;

          // Open the parent Tense only if it was collapsed; leave the others as they are.
          const body = link.closest(".tense-body");
          const button = body && tenseList.querySelector(`[aria-controls="${body.id}"]`);
          if (button && button.getAttribute("aria-expanded") !== "true") {
              setTenseOpen(button, true);
              updateToggleAll();
          }

          requestAnimationFrame(() => {
              link.scrollIntoView({ behavior: "smooth", block: "center" });
              link.classList.add("is-returned");
              link.focus({ preventScroll: true });
              const title = slot(link, "title");
              if (liveRegion) liveRegion.textContent = t("conj.returnedTo", { title: title ? title.textContent.trim() : "" });
              window.setTimeout(() => link.classList.remove("is-returned"), 1800);
          });
      }

      window.addEventListener("hashchange", restoreLessonContext);

      /* ---------- Preview states ---------- */
      let data = SAMPLE_CONJUGATION;
      if (preview === "not-started") {
          data = {
              tenses: SAMPLE_CONJUGATION.tenses.map((tense) => ({
                  ...tense,
                  lessons: tense.lessons.map((lesson) => ({ ...lesson, learned: false, review_later: false })),
              })),
          };
      }
      if (preview === "empty") data = { tenses: [] };

      if (preview === "loading") {
          showPageState("loading");
      } else if (preview === "error") {
          showPageState("error");
      } else {
          render(data);
      }
      document.querySelector('[data-action="retry"]').addEventListener("click", () => render(SAMPLE_CONJUGATION));

      /* ---------- Compact navigation menu (same behavior as Dashboard, FD §8.5) ---------- */
      const menuButton = document.querySelector(".menu-button");
      const mobileNav = document.getElementById("mobile-nav");
      const menuIcon = menuButton.querySelector(".material-symbols-outlined");

      function setMenu(open) {
          menuButton.setAttribute("aria-expanded", String(open));
          menuButton.setAttribute("aria-label", t(open ? "common.menuNavClose" : "common.menuNav"));
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
      /* ---------- Language change: re-render this page's copy in place ---------- */
      onLanguageChange(() => {
          const openTenses = tenseButtons().map((button) => button.getAttribute("aria-expanded") === "true");
          if (currentData) {
              render(currentData, { restore: false });
              tenseButtons().forEach((button, index) => {
                  if (index < openTenses.length) setTenseOpen(button, openTenses[index]);
              });
          }
          updateToggleAll();
          setMenu(!mobileNav.hidden);
      });
  })();

}
