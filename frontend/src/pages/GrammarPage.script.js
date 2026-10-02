// Behavior carried over from the raw UI prototype (grammar-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by GrammarPage.jsx.
import { t } from "../i18n/index.js";

export default function init({ onLanguageChange } = {}) {
  // UI preview only. No fetching, authentication, or routing is added here.
  // Production components receive this data from GET /api/v1/grammar (API Contract §9.1).
  (() => {
      const preview = new URLSearchParams(window.location.search).get("preview");

      // Sample response in the shape of GET /api/v1/grammar. Titles are sample curriculum
      // data; the layout must not depend on these particular titles or counts.
      const SAMPLE_GRAMMAR = {
          parts: [
              {
                  title_fr: "Le groupe du nom",
                  title: "Cụm danh từ",
                  chapters: [
                      {
                          title_fr: "Les déterminants",
                          title: "Từ hạn định",
                          lessons: [
                              { slug: "articles-definis", title_fr: "Les articles définis", title: "Mạo từ xác định", learned: true, review_later: false },
                              { slug: "articles-indefinis", title_fr: "Les articles indéfinis", title: "Mạo từ bất định", learned: true, review_later: false },
                              { slug: "articles-partitifs", title_fr: "Les articles partitifs", title: "Mạo từ bộ phận", learned: true, review_later: true },
                              { slug: "adjectifs-demonstratifs", title_fr: "Les adjectifs démonstratifs", title: "Tính từ chỉ định", learned: true, review_later: false },
                          ],
                      },
                      {
                          title_fr: "Le nom",
                          title: "Danh từ",
                          lessons: [
                              {
                                  slug: "genre-des-noms",
                                  title_fr: "Le genre des noms : masculin et féminin des noms de personnes et de métiers (-teur/-trice, -eur/-euse, -en/-enne)",
                                  title: "Giống của danh từ: giống đực và giống cái của danh từ chỉ người và nghề nghiệp (-teur/-trice, -eur/-euse, -en/-enne)",
                                  learned: true,
                                  review_later: false,
                              },
                              { slug: "pluriel-des-noms", title_fr: "Le pluriel des noms", title: "Số nhiều của danh từ", learned: false, review_later: true },
                          ],
                      },
                      {
                          title_fr: "L'adjectif qualificatif et l'adjectif numéral",
                          title: "Tính từ chỉ tính chất và tính từ chỉ số",
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
                  title_fr: "Le groupe du verbe",
                  title: "Cụm động từ",
                  chapters: [
                      {
                          title_fr: "Les pronoms personnels compléments",
                          title: "Đại từ nhân xưng bổ ngữ",
                          lessons: [
                              { slug: "pronoms-cod", title_fr: "Les pronoms compléments d'objet direct", title: "Đại từ bổ ngữ trực tiếp", learned: true, review_later: true },
                              { slug: "pronoms-coi", title_fr: "Les pronoms compléments d'objet indirect", title: "Đại từ bổ ngữ gián tiếp", learned: false, review_later: false },
                              { slug: "pronoms-y-en", title_fr: "Les pronoms « y » et « en »", title: "Đại từ « y » và « en »", learned: false, review_later: false },
                          ],
                      },
                  ],
              },
              {
                  title_fr: "La phrase",
                  title: "Câu",
                  chapters: [
                      {
                          title_fr: "La négation",
                          title: "Câu phủ định",
                          lessons: [
                              { slug: "negation-simple", title_fr: "La négation simple : ne… pas", title: "Phủ định đơn giản: ne… pas", learned: false, review_later: false },
                              // No localized title yet: the backend falls back to title_fr (API §4.9).
                              { slug: "negation-jamais-plus-rien", title_fr: "Ne… jamais, ne… plus, ne… rien", title: "Ne… jamais, ne… plus, ne… rien", learned: false, review_later: false },
                          ],
                      },
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
      // title_fr for a missing translation (API §4.9), the support line is omitted.
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

      function renderLesson(lesson) {
          const item = fromTemplate("lesson-template");
          const link = slot(item, "link");
          link.dataset.route = `/grammar/lessons/${lesson.slug}`;
          link.classList.toggle("is-learned", lesson.learned);
          link.classList.toggle("is-saved", lesson.review_later);
          slot(item, "status").textContent = lesson.learned ? "check_circle" : "radio_button_unchecked";
          setTitles(slot(item, "title"), slot(item, "support"), lesson);
          slot(item, "learned").hidden = !lesson.learned;
          slot(item, "learned").classList.toggle("badge-quiet", lesson.learned && lesson.review_later);
          slot(item, "review-later").hidden = !lesson.review_later;
          slot(item, "meta").hidden = !lesson.learned && !lesson.review_later;
          return item;
      }

      function renderChapter(chapter) {
          const item = fromTemplate("chapter-template");
          const lessons = chapter.lessons || [];
          const learned = lessons.filter((lesson) => lesson.learned).length;
          setTitles(slot(item, "title"), slot(item, "support"), chapter);
          slot(item, "count").textContent = t("common.lessonsOf", { learned: learned, total: lessons.length, n: lessons.length });
          const isComplete = lessons.length > 0 && learned === lessons.length;
          slot(item, "count-badge").classList.toggle("badge-info", !isComplete);
          slot(item, "count-badge").classList.toggle("badge-learned", isComplete);
          slot(item, "count-icon").hidden = !isComplete;
          const list = slot(item, "lessons");
          list.append(...lessons.map(renderLesson));
          list.hidden = lessons.length === 0;
          slot(item, "empty").hidden = lessons.length > 0;
          return item;
      }

      function renderPart(part, index) {
          const section = fromTemplate("part-template");
          const lessons = (part.chapters || []).flatMap((chapter) => chapter.lessons || []);
          const learned = lessons.filter((lesson) => lesson.learned).length;
          const headingId = `part-${index + 1}-title`;
          section.querySelector(".part-progress")
              .classList.toggle("is-complete", lessons.length > 0 && learned === lessons.length);

          section.setAttribute("aria-labelledby", headingId);
          slot(section, "heading").id = headingId;
          slot(section, "number").textContent = String(index + 1);
          slot(section, "position").textContent = t("grammar.partPosition", { n: index + 1 });
          setTitles(slot(section, "title"), slot(section, "support"), part);
          slot(section, "count").textContent = t("common.lessonsOf", { learned: learned, total: lessons.length, n: lessons.length });
          const track = slot(section, "track");
          track.setAttribute("aria-label", t("common.progressOf", { title: part.title_fr || part.title }));
          setProgress(track, slot(section, "percent"), learned, lessons.length);
          slot(section, "chapters").append(...(part.chapters || []).map(renderChapter));
          return section;
      }

      /* ---------- Page states ---------- */
      const content = document.querySelector("[data-grammar-content]");
      const overview = document.querySelector("[data-overview]");
      const partList = document.querySelector("[data-part-list]");
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
          const parts = data.parts || [];
          const chapters = parts.flatMap((part) => part.chapters || []);
          const lessons = chapters.flatMap((chapter) => chapter.lessons || []);
          // Same rule as ConjugationPage: no parts or no lessons at all is the empty state.
          if (parts.length === 0 || lessons.length === 0) {
              showPageState("empty");
              return;
          }
          const learned = lessons.filter((lesson) => lesson.learned).length;

          setProgress(slot(overview, "track"), slot(overview, "percent"), learned, lessons.length);
          slot(overview, "count").textContent = t("common.lessonsOf", { learned: learned, total: lessons.length, n: lessons.length });
          slot(overview, "review-count").textContent =
              t("common.lessonsN", { n: lessons.filter((lesson) => lesson.review_later).length });
          overview.classList.toggle("is-complete", lessons.length > 0 && learned === lessons.length);
          document.querySelector("[data-summary]").replaceChildren(
              ...[
                  t("grammar.partsCount", { n: parts.length }),
                  t("grammar.chaptersCount", { n: chapters.length }),
                  t("grammar.lessonsCount", { n: lessons.length }),
              ].map((text) => {
                  const chip = document.createElement("li");
                  chip.className = "badge badge-info";
                  chip.textContent = text;
                  return chip;
              })
          );
          partList.replaceChildren(...parts.map(renderPart));
          updateToggleAll();
          showPageState("content");
          // Grammar data is now in the DOM: if we arrived here from a lesson's "Quay lại
          // Ngữ pháp" link, restore that lesson's place on the page (see function below).
          if (restore) restoreLessonContext();
      }

      /* ---------- Expand / collapse all chapters (frontend-only UI state) ---------- */
      const toggleAll = document.querySelector('[data-action="toggle-all"]');

      function chapters() {
          return partList.querySelectorAll("details.chapter");
      }

      function updateToggleAll() {
          const anyOpen = Array.from(chapters()).some((chapter) => chapter.open);
          slot(toggleAll, "label").textContent = t(anyOpen ? "common.collapseAll" : "common.expandAll");
          slot(toggleAll, "icon").textContent = anyOpen ? "unfold_less" : "unfold_more";
      }

      toggleAll.addEventListener("click", () => {
          const open = !Array.from(chapters()).some((chapter) => chapter.open);
          chapters().forEach((chapter) => {
              chapter.open = open;
          });
          updateToggleAll();
      });
      // "toggle" does not bubble; listen in the capture phase.
      partList.addEventListener("toggle", updateToggleAll, true);

      /* ---------- Return-from-lesson context restore ----------
         Triggered by a URL hash of the form #lesson-<slug>, set by GrammarLessonPage's
         "Quay lại Ngữ pháp" link (no API/backend change: the slug already comes from
         GET /api/v1/grammar). Reading it from the URL, rather than only from in-memory
         navigation state, means a direct load or a refresh on that hash still works. */
      const liveRegion = document.querySelector("[data-live-region]");

      function announce(message) {
          if (liveRegion) liveRegion.textContent = message;
      }

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
          const link = partList.querySelector(`[data-route="/grammar/lessons/${escapedSlug}"]`);
          if (!link) return;

          // Expand the parent Chapter only if it was collapsed; leave every other
          // Chapter's open/closed state exactly as the learner left it.
          const details = link.closest("details.chapter");
          if (details && !details.open) details.open = true;

          // Let the (possibly just-expanded) layout settle before measuring scroll position.
          requestAnimationFrame(() => {
              link.scrollIntoView({ behavior: "smooth", block: "center" });
              link.classList.add("is-returned");
              // The link is a normal, already-focusable row; moving focus here matches
              // where the learner asked to go, so it lands as an expected destination
              // rather than a surprise jump, and keeps it reachable by keyboard.
              link.focus({ preventScroll: true });
              const title = slot(link, "title");
              announce(t("grammar.returnedTo", { title: title ? title.textContent.trim() : "" }));
              window.setTimeout(() => link.classList.remove("is-returned"), 1800);
          });
      }

      window.addEventListener("hashchange", restoreLessonContext);

      /* ---------- Preview states ---------- */
      let data = SAMPLE_GRAMMAR;
      if (preview === "not-started") {
          data = {
              parts: SAMPLE_GRAMMAR.parts.map((part) => ({
                  ...part,
                  chapters: part.chapters.map((chapter) => ({
                      ...chapter,
                      lessons: chapter.lessons.map((lesson) => ({ ...lesson, learned: false, review_later: false })),
                  })),
              })),
          };
      }
      if (preview === "empty") data = { parts: [] };

      if (preview === "loading") {
          showPageState("loading");
      } else if (preview === "error") {
          showPageState("error");
      } else {
          render(data);
      }
      document.querySelector('[data-action="retry"]').addEventListener("click", () => render(SAMPLE_GRAMMAR));

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
          const openChapters = Array.from(chapters()).map((chapter) => chapter.open);
          if (currentData) {
              render(currentData, { restore: false });
              chapters().forEach((chapter, index) => {
                  if (index < openChapters.length) chapter.open = openChapters[index];
              });
              updateToggleAll();
          }
          setMenu(!mobileNav.hidden);
      });
  })();

}
