// Behavior carried over from the raw UI prototype (grammar-lesson-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by GrammarLessonPage.jsx.
import { t } from "../i18n/index.js";

export default function init({ onLanguageChange } = {}) {
  // UI preview only. No fetching, authentication, persistence, or routing is added here.
  // Production components receive this data from GET /api/v1/grammar/lessons/{slug} (API §9.2).
  (() => {
      const preview = new URLSearchParams(window.location.search).get("preview");

      // Sample responses in the shape of GET /api/v1/grammar/lessons/{slug}. `content` is one
      // localized Markdown string (truncated here); its rendered HTML is in the templates above.
      const SAMPLE_LESSON = {
          slug: "articles-indefinis",
          title_fr: "Les articles indéfinis",
          title: "Mạo từ bất định",
          context: {
              part: { title_fr: "Le groupe du nom", title: "Cụm danh từ" },
              chapter: { title_fr: "Les déterminants", title: "Từ hạn định" },
          },
          content: "## Khi nào dùng mạo từ bất định?\n\nTương tự *a / an* trong tiếng Anh…",
          state: { learned: true, review_later: false },
      };

      const SAMPLE_ALT_LESSON = {
          slug: "negation-jamais-plus-rien",
          title_fr: "Ne… jamais, ne… plus, ne… rien",
          // No localized title yet: the backend falls back to title_fr (API §4.9).
          title: "Ne… jamais, ne… plus, ne… rien",
          context: {
              part: { title_fr: "La phrase", title: "Câu" },
              chapter: { title_fr: "La négation", title: "Câu phủ định" },
          },
          content: "Ba cụm phủ định này dùng cùng khung với **ne … pas**…",
          state: { learned: false, review_later: false },
      };

      // Sample response in the shape of GET /api/v1/grammar (API §9.1), the same Grammar
      // browse endpoint and curriculum order GrammarPage's own SAMPLE_GRAMMAR uses. This is
      // the ONLY source of Previous/Next order: there is no separate frontend ordering.
      // Production fetches this independently of how the lesson page was reached, so
      // Previous/Next still resolves on a direct URL load or refresh of
      // /grammar/lessons/{slug}, not only when arriving from GrammarPage. Only slug/
      // title_fr/title are used for navigation; learned/review_later ride along because
      // they come from the same response, but the nav cards do not render them (state
      // badges stay a GrammarPage/lesson-header concern, not duplicated here).
      const SAMPLE_GRAMMAR_BROWSE = {
          parts: [
              {
                  title_fr: "Le groupe du nom", title: "Cụm danh từ",
                  chapters: [
                      {
                          title_fr: "Les déterminants", title: "Từ hạn định",
                          lessons: [
                              { slug: "articles-definis", title_fr: "Les articles définis", title: "Mạo từ xác định", learned: true, review_later: false },
                              { slug: "articles-indefinis", title_fr: "Les articles indéfinis", title: "Mạo từ bất định", learned: true, review_later: false },
                              { slug: "articles-partitifs", title_fr: "Les articles partitifs", title: "Mạo từ bộ phận", learned: true, review_later: true },
                              { slug: "adjectifs-demonstratifs", title_fr: "Les adjectifs démonstratifs", title: "Tính từ chỉ định", learned: true, review_later: false },
                          ],
                      },
                      {
                          title_fr: "Le nom", title: "Danh từ",
                          lessons: [
                              { slug: "genre-des-noms", title_fr: "Le genre des noms : masculin et féminin des noms de personnes et de métiers (-teur/-trice, -eur/-euse, -en/-enne)", title: "Giống của danh từ: giống đực và giống cái của danh từ chỉ người và nghề nghiệp (-teur/-trice, -eur/-euse, -en/-enne)", learned: true, review_later: false },
                              { slug: "pluriel-des-noms", title_fr: "Le pluriel des noms", title: "Số nhiều của danh từ", learned: false, review_later: true },
                          ],
                      },
                      {
                          title_fr: "L'adjectif qualificatif et l'adjectif numéral", title: "Tính từ chỉ tính chất và tính từ chỉ số",
                          lessons: [
                              { slug: "accord-adjectif", title_fr: "L'accord de l'adjectif qualificatif", title: "Sự hợp giống và số của tính từ", learned: true, review_later: false },
                              { slug: "place-adjectif", title_fr: "La place de l'adjectif qualificatif", title: "Vị trí của tính từ", learned: true, review_later: false },
                              { slug: "adjectifs-numeraux", title_fr: "Les adjectifs numéraux cardinaux et ordinaux", title: "Tính từ chỉ số đếm và số thứ tự", learned: true, review_later: false },
                              { slug: "autres-emplois-adjectifs", title_fr: "Autres emplois des adjectifs qualificatifs", title: "Các cách dùng khác của tính từ", learned: false, review_later: false },
                              { slug: "comparatif", title_fr: "Le comparatif", title: "So sánh hơn, kém và bằng", learned: false, review_later: false },
                              { slug: "superlatif", title_fr: "Le superlatif", title: "So sánh nhất", learned: false, review_later: false },
                          ],
                      },
                  ],
              },
              {
                  title_fr: "Le groupe du verbe", title: "Cụm động từ",
                  chapters: [
                      {
                          title_fr: "Les pronoms personnels compléments", title: "Đại từ nhân xưng bổ ngữ",
                          lessons: [
                              { slug: "pronoms-cod", title_fr: "Les pronoms compléments d'objet direct", title: "Đại từ bổ ngữ trực tiếp", learned: true, review_later: true },
                              { slug: "pronoms-coi", title_fr: "Les pronoms compléments d'objet indirect", title: "Đại từ bổ ngữ gián tiếp", learned: false, review_later: false },
                              { slug: "pronoms-y-en", title_fr: "Les pronoms « y » et « en »", title: "Đại từ « y » và « en »", learned: false, review_later: false },
                          ],
                      },
                  ],
              },
              {
                  title_fr: "La phrase", title: "Câu",
                  chapters: [
                      {
                          title_fr: "La négation", title: "Câu phủ định",
                          lessons: [
                              { slug: "negation-simple", title_fr: "La négation simple : ne… pas", title: "Phủ định đơn giản: ne… pas", learned: false, review_later: false },
                              { slug: "negation-jamais-plus-rien", title_fr: "Ne… jamais, ne… plus, ne… rien", title: "Ne… jamais, ne… plus, ne… rien", learned: false, review_later: false },
                          ],
                      },
                  ],
              },
          ],
      };

      // Flatten Part -> Chapter -> Lesson once, preserving the order the API already
      // returns (FD §4.5: Part/Chapter are grouping structures, not routes or a resortable
      // key). This flat list is the only thing Previous/Next reads from.
      function flattenLessons(browse) {
          const flat = [];
          browse.parts.forEach((part) => {
              part.chapters.forEach((chapter) => {
                  chapter.lessons.forEach((lesson) => flat.push(lesson));
              });
          });
          return flat;
      }
      const FLAT_LESSONS = flattenLessons(SAMPLE_GRAMMAR_BROWSE);

      /* ---------- Helpers ---------- */
      const page = document.querySelector("[data-lesson]");
      const article = document.querySelector("[data-lesson-content]");
      const actions = article.querySelector(".lesson-actions");

      function slot(root, name) {
          return root.querySelector(`[data-slot="${name}"]`);
      }

      // French title is primary (lang="fr"); the localized title supports it. When the API has
      // fallen back to title_fr (API §4.9), the support line is hidden rather than repeated.
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
      // changed field and renders the `state` from the response (API §13.2).
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
          link.dataset.route = `/grammar/lessons/${neighbor.slug}`;
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

          const crumbs = document.querySelector(".breadcrumb-list");
          const partCrumb = crumbs.querySelector('[data-crumb="part"]');
          const chapterCrumb = crumbs.querySelector('[data-crumb="chapter"]');
          setTitles(slot(partCrumb, "title"), slot(partCrumb, "support"), lesson.context.part, "· ");
          setTitles(slot(chapterCrumb, "title"), slot(chapterCrumb, "support"), lesson.context.chapter, "· ");
          const current = slot(crumbs.querySelector('[data-crumb="lesson"]'), "title");
          current.textContent = lesson.title_fr || lesson.title;

          slot(actions, "practice").dataset.route = `/practice/${lesson.slug}`;
          // Keep the Grammar breadcrumb return target in sync
          // so GrammarPage can restore the current lesson position.
          slot(page, "grammar-return").href = `/grammar#lesson-${lesson.slug}`;
          renderLessonNav(lesson);
          slot(article, "content").replaceChildren(
              document.getElementById(contentTemplateId).content.cloneNode(true)
          );

          state = { ...lesson.state };
          renderState();

          // Production: once this GET has succeeded, record the open through the shared
          // learner-state action: POST /api/v1/me/learning-units/{slug}/open (API §13.1).
      }

      /* ---------- Page states ---------- */
      const pageStates = document.querySelectorAll("[data-page-state]");
      const contextCrumbs = document.querySelectorAll("[data-crumb]");

      function showPageState(stateName) {
          pageStates.forEach((element) => {
              element.hidden = element.dataset.pageState !== stateName;
          });
          article.hidden = stateName !== "content";
          // Without lesson data only the Grammar crumb is known.
          contextCrumbs.forEach((crumb) => {
              crumb.hidden = stateName !== "content";
          });
      }

      function showSample() {
          let lesson = SAMPLE_LESSON;
          let template = "content-articles-indefinis";
          if (preview === "alt-content") {
              lesson = SAMPLE_ALT_LESSON;
              template = "content-negation-jamais-plus-rien";
          }
          if (preview === "first") {
              // Navigation preview only: the first lesson of the sample curriculum (content is
              // the sample Markdown; only the slug and titles change).
              lesson = { ...lesson, slug: "articles-definis", title_fr: "Les articles définis", title: "Mạo từ xác định" };
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
