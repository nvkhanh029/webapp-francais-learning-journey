// Behavior carried over from the raw UI prototype (conjugation-lesson-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by ConjugationLessonPage.jsx.
import { t } from "../i18n/index.js";

export default function init({ onLanguageChange } = {}) {
  // UI preview only. No fetching, authentication, persistence, or routing is added here.
  // Production components receive this data from GET /api/v1/conjugation/lessons/{slug}.
  (() => {
      const preview = new URLSearchParams(window.location.search).get("preview");

      // Sample responses in the shape of GET /api/v1/conjugation/lessons/{slug}. `content` is
      // one localized Markdown string (truncated here); its rendered HTML is in the templates
      // above. State matches these lessons on ConjugationPage's sample.
      const SAMPLE_LESSON = {
          slug: "present-regular-er",
          title_fr: "Les verbes réguliers en -ER",
          title: "Động từ có quy tắc đuôi -ER",
          context: {
              tense: { title_fr: "Le présent de l'indicatif", title: "Thì hiện tại" },
          },
          content: "Đây là nhóm động từ phổ biến nhất trong tiếng Pháp…\n\n## Cách hình thành\n…",
          state: { learned: true, review_later: false },
      };

      const SAMPLE_ALT_LESSON = {
          slug: "present-regular-re",
          title_fr: "Les verbes réguliers en -RE",
          title: "Động từ có quy tắc đuôi -RE",
          context: {
              tense: { title_fr: "Le présent de l'indicatif", title: "Thì hiện tại" },
          },
          content: "Nhóm này gồm các động từ có nguyên mẫu kết thúc bằng `-re`…",
          state: { learned: false, review_later: true },
      };

      // Sample response in the shape of GET /api/v1/conjugation, mirroring ConjugationPage's
      // SAMPLE_CONJUGATION (same slugs, titles and order). This is the ONLY source of
      // Previous / Next order: there is no separate frontend ordering. Production fetches it
      // independently of how the lesson page was reached, so Previous / Next still resolves on
      // a direct URL load or refresh. Only slug / title_fr / title are used by the navigation.
      const SAMPLE_CONJUGATION_BROWSE = {
          tenses: [
              {
                  title_fr: "Le présent de l'indicatif", title: "Thì hiện tại",
                  lessons: [
                      { slug: "present-regular-er", title_fr: "Les verbes réguliers en -ER", title: "Động từ có quy tắc đuôi -ER", learned: true, review_later: false },
                      { slug: "present-regular-ir", title_fr: "Les verbes réguliers en -IR", title: "Động từ có quy tắc đuôi -IR", learned: true, review_later: false },
                      { slug: "present-regular-re", title_fr: "Les verbes réguliers en -RE", title: "Động từ có quy tắc đuôi -RE", learned: false, review_later: true },
                      { slug: "present-spelling-changes", title_fr: "Les verbes en -ER avec changements orthographiques : -cer, -ger, -yer, e/é + consonne", title: "Động từ đuôi -ER có biến đổi chính tả: -cer, -ger, -yer, e/é + phụ âm", learned: true, review_later: true },
                      { slug: "present-irregular-patterns", title_fr: "Les verbes irréguliers fréquents", title: "Các động từ bất quy tắc thông dụng", learned: false, review_later: false },
                  ],
              },
              {
                  title_fr: "Le passé composé", title: "Thì quá khứ kép",
                  lessons: [
                      { slug: "passe-compose-avoir", title_fr: "La formation avec l'auxiliaire avoir", title: "Cách thành lập với trợ động từ avoir", learned: true, review_later: false },
                      { slug: "passe-compose-etre", title_fr: "La formation avec l'auxiliaire être", title: "Cách thành lập với trợ động từ être", learned: true, review_later: true },
                      { slug: "passe-compose-accord", title_fr: "L'accord du participe passé", title: "Sự hợp giống và số của quá khứ phân từ", learned: false, review_later: false },
                  ],
              },
              {
                  title_fr: "L'imparfait", title: "Thì quá khứ chưa hoàn thành",
                  lessons: [
                      { slug: "imparfait-formation", title_fr: "La formation de l'imparfait", title: "Cách thành lập thì imparfait", learned: true, review_later: false },
                      { slug: "imparfait-passe-compose", title_fr: "L'imparfait et le passé composé", title: "Phân biệt imparfait và passé composé", learned: false, review_later: true },
                  ],
              },
              {
                  title_fr: "Le futur simple", title: "Thì tương lai đơn",
                  lessons: [
                      { slug: "futur-simple-formation", title_fr: "La formation du futur simple", title: "Cách thành lập thì futur simple", learned: false, review_later: false },
                      { slug: "futur-simple-irregular-stems", title_fr: "Les radicaux irréguliers du futur simple", title: "Gốc bất quy tắc của futur simple", learned: false, review_later: false },
                      { slug: "futur-simple-futur-proche", title_fr: "Futur simple ou futur proche ?", title: "Futur simple ou futur proche ?", learned: false, review_later: false },
                  ],
              },
          ],
      };

      // Flatten Tense -> Lesson once, preserving the order the API already returns (a Tense is
      // a grouping structure, not a route or a re-sortable key). This flat list is the only
      // thing Previous / Next reads from, so it crosses Tense boundaries naturally.
      const FLAT_LESSONS = SAMPLE_CONJUGATION_BROWSE.tenses.flatMap((tense) => tense.lessons);

      /* ---------- Helpers ---------- */
      const page = document.querySelector("[data-lesson]");
      const article = document.querySelector("[data-lesson-content]");
      const actions = article.querySelector(".lesson-actions");

      function slot(root, name) {
          return root.querySelector(`[data-slot="${name}"]`);
      }

      // French title is primary (lang="fr"); the localized title supports it. When the API has
      // fallen back to title_fr, the support line is hidden rather than repeated.
      function setTitles(primary, support, item, supportPrefix = "") {
          primary.textContent = item.title_fr || item.title;
          if (item.title_fr) primary.setAttribute("lang", "fr");
          else primary.removeAttribute("lang");
          const hasSupport = Boolean(item.title_fr && item.title && item.title !== item.title_fr);
          support.hidden = !hasSupport;
          support.textContent = hasSupport ? `${supportPrefix}${item.title}` : "";
      }

      /* ---------- Learner state ---------- */
      let state = { learned: false, review_later: false };

      function renderState({ announce, focus } = {}) {
          const { learned, review_later: saved } = state;
          page.classList.toggle("is-learned", learned);
          page.classList.toggle("is-saved", saved);

          const header = article.querySelector(".lesson-header");
          slot(header, "badge-learned").hidden = !learned;
          slot(header, "badge-review").hidden = !saved;
          slot(header, "badges").hidden = !learned && !saved;

          actions.querySelector('[data-action="mark-learned"]').hidden = learned;
          slot(actions, "learned-box").hidden = !learned;
          actions.querySelector('[data-action="save-review"]').hidden = saved;
          slot(actions, "review-box").hidden = !saved;

          // One primary action at a time: Mark as Learned until learned, then Practice.
          const practice = slot(actions, "practice");
          practice.classList.toggle("button-primary", learned);
          practice.classList.toggle("button-secondary", !learned);
          slot(actions, "practice-note").hidden = learned;

          if (announce) slot(actions, "announce").textContent = announce;
          // The pressed control is replaced by its counterpart; keep keyboard focus with it.
          if (focus) {
              actions
                  .querySelector(`[data-action="${focus}"]`)
                  .focus({ preventScroll: true });
          }
      }

      // Prototype only: production sends PATCH /api/v1/me/learning-units/{slug}/state with the
      // changed field and renders the `state` from the response.
      const ACTIONS = {
          "mark-learned": { change: { learned: true }, get announce() { return t("lesson.marked"); }, focus: "unmark-learned" },
          "unmark-learned": { change: { learned: false }, get announce() { return t("lesson.unmarked"); }, focus: "mark-learned" },
          "save-review": { change: { review_later: true }, get announce() { return t("lesson.savedMessage"); }, focus: "remove-review" },
          "remove-review": { change: { review_later: false }, get announce() { return t("lesson.removedMessage"); }, focus: "save-review" },
      };

      actions.addEventListener("click", (event) => {
          const button = event.target.closest("button[data-action]");
          const action = button && ACTIONS[button.dataset.action];
          if (!action) return;
          state = { ...state, ...action.change };
          renderState(action);
      });

      /* ---------- Previous / Next lesson navigation ---------- */
      // Fills one side. With no neighbor the slot is kept and rendered unavailable: no href
      // (so it is neither focusable nor navigable), aria-disabled, and neutral copy.

      function fillNavLink(link, neighbor, side) {
          const title = slot(link, "title");
          const support = slot(link, "support");
          if (!neighbor) {
              link.removeAttribute("href");
              link.removeAttribute("data-route");
              link.setAttribute("role", "link");
              link.setAttribute("aria-disabled", "true");
              title.removeAttribute("lang");
              title.textContent = t(side === "previous" ? "lesson.noPrevious" : "lesson.noNext");
              support.hidden = true;
              support.textContent = "";
              return;
          }
          link.setAttribute("href", "#");
          link.removeAttribute("role");
          link.removeAttribute("aria-disabled");
          link.dataset.route = `/conjugation/lessons/${neighbor.slug}`;
          setTitles(title, support, neighbor);
      }

      function renderLessonNav(lesson) {
          const nav = document.querySelector("[data-lesson-nav]");
          const index = FLAT_LESSONS.findIndex((item) => item.slug === lesson.slug);
          const previous = index > 0 ? FLAT_LESSONS[index - 1] : null;
          const next = index !== -1 && index < FLAT_LESSONS.length - 1 ? FLAT_LESSONS[index + 1] : null;

          fillNavLink(slot(nav, "nav-previous"), previous, "previous");
          fillNavLink(slot(nav, "nav-next"), next, "next");
      }

      /* ---------- Lesson ---------- */
      function renderLesson(lesson, contentTemplateId) {
          document.title = t("common.pageTitle", { title: lesson.title_fr || lesson.title });

          const header = article.querySelector(".lesson-header");
          setTitles(slot(header, "title"), slot(header, "support"), lesson);

          // Tense: contextual label only (no route, no slug). Shown in the header and, from
          // 640px, in the breadcrumb trail.
          const context = slot(header, "context");
          setTitles(slot(context, "title"), slot(context, "support"), lesson.context.tense, " · ");

          const crumbs = document.querySelector(".breadcrumb-list");
          const tenseCrumb = crumbs.querySelector('[data-crumb="tense"]');
          setTitles(slot(tenseCrumb, "title"), slot(tenseCrumb, "support"), lesson.context.tense, "· ");
          slot(crumbs.querySelector('[data-crumb="lesson"]'), "title").textContent = lesson.title_fr || lesson.title;

          slot(actions, "practice").dataset.route = `/practice/${lesson.slug}`;
          // Keep the Conjugation breadcrumb return target in sync so ConjugationPage can
          // restore the current lesson position.
          slot(page, "conjugation-return").href = `/conjugation#lesson-${lesson.slug}`;
          renderLessonNav(lesson);
          slot(article, "content").replaceChildren(
              document.getElementById(contentTemplateId).content.cloneNode(true)
          );

          state = { ...lesson.state };
          renderState();

          // Production: once this GET has succeeded, record the open through the shared
          // learner-state action: POST /api/v1/me/learning-units/{slug}/open.
      }

      /* ---------- Page states ---------- */
      const pageStates = document.querySelectorAll("[data-page-state]");
      const contextCrumbs = document.querySelectorAll("[data-crumb]");

      function showPageState(stateName) {
          pageStates.forEach((element) => {
              element.hidden = element.dataset.pageState !== stateName;
          });
          article.hidden = stateName !== "content";
          // Without lesson data only the Chia động từ crumb is known.
          contextCrumbs.forEach((crumb) => {
              crumb.hidden = stateName !== "content";
          });
      }

      function showSample() {
          let lesson = SAMPLE_LESSON;
          let template = "content-present-regular-er";
          if (preview === "alt-content") {
              lesson = SAMPLE_ALT_LESSON;
              template = "content-present-regular-re";
          }
          if (preview === "last") {
              // Navigation preview only: the last lesson of the sample curriculum (content is
              // the sample -ER Markdown; only the slug and titles change).
              lesson = { ...lesson, slug: "futur-simple-futur-proche", title_fr: "Futur simple ou futur proche ?", title: "Futur simple ou futur proche ?", context: { tense: { title_fr: "Le futur simple", title: "Thì tương lai đơn" } } };
          }
          const previewStates = {
              "not-learned": { learned: false, review_later: false },
              review: { learned: false, review_later: true },
              both: { learned: true, review_later: true },
          };
          if (previewStates[preview]) lesson = { ...lesson, state: previewStates[preview] };
          renderLesson(lesson, template);
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
          if (!article.hidden) {
              // Re-render the page copy but keep the learner state toggled on this page.
              const learnerState = { ...state };
              showSample();
              state = learnerState;
              renderState();
          }
          setMenu(!mobileNav.hidden);
      });
  })();

}
