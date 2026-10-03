// Behavior carried over from the raw UI prototype (vocabulary-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by VocabularyPage.jsx.
import { t } from "../i18n/index.js";

export default function init({ onLanguageChange } = {}) {
  // UI preview only. No fetching, authentication, or routing is added here.
  // Production components receive this data from GET /api/v1/vocabulary (API Contract §10.1).
  (() => {
      const preview = new URLSearchParams(window.location.search).get("preview");

      // Static learner-summary sample for the page-level progress card. Production should
      // source learned/total from GET /api/v1/me/dashboard (progress.vocabulary) and the
      // Vocabulary Review Later count from GET /api/v1/me/review-later.
      const SAMPLE_VOCABULARY_PROGRESS = { learned: 9, total: 17, reviewLater: 3 };

      // Sample response in the shape of GET /api/v1/vocabulary. Titles are sample curriculum
      // data; the layout must not depend on these particular titles or counts.
      const SAMPLE_VOCABULARY = {
          categories: [
              {
                  title_fr: "La nourriture et la restauration",
                  title: "Ẩm thực và nhà hàng",
                  topics: [
                      { slug: "alimentation-1", title_fr: "L'alimentation (1)", title: "Thực phẩm (1)" },
                      { slug: "alimentation-2", title_fr: "L'alimentation (2)", title: "Thực phẩm (2)" },
                      { slug: "restaurant-cafe", title_fr: "Au restaurant et au café", title: "Tại nhà hàng và quán cà phê" },
                  ],
              },
              {
                  title_fr: "Les transports et les voyages",
                  title: "Giao thông và du lịch",
                  topics: [
                      { slug: "transports-publics", title_fr: "Les transports publics", title: "Phương tiện giao thông công cộng" },
                      { slug: "transports-prives", title_fr: "Les transports privés", title: "Phương tiện giao thông cá nhân" },
                      { slug: "voyages", title_fr: "Les voyages et les déplacements", title: "Du lịch và di chuyển" },
                      { slug: "hebergement", title_fr: "L'hébergement de vacances", title: "Nơi lưu trú khi đi du lịch" },
                  ],
              },
              {
                  title_fr: "La vie quotidienne, la maison et les relations familiales entre les générations",
                  title: "Đời sống hằng ngày, nhà cửa và quan hệ gia đình giữa các thế hệ",
                  topics: [
                      {
                          slug: "famille",
                          title_fr: "Les membres de la famille : parents, grands-parents, beaux-parents et cousins éloignés",
                          title: "Các thành viên trong gia đình: cha mẹ, ông bà, bố mẹ chồng/vợ và anh chị em họ xa",
                      },
                      { slug: "routines", title_fr: "Les routines du matin et du soir", title: "Thói quen buổi sáng và buổi tối" },
                      // No localized title yet: the backend falls back to title_fr (API §4.9).
                      { slug: "taches-menageres", title_fr: "Les tâches ménagères", title: "Les tâches ménagères" },
                  ],
              },
              {
                  title_fr: "Le corps et la santé",
                  title: "Cơ thể và sức khỏe",
                  topics: [
                      { slug: "corps", title_fr: "Les parties du corps", title: "Các bộ phận cơ thể" },
                      { slug: "chez-le-medecin", title_fr: "Chez le médecin", title: "Đi khám bệnh" },
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
      // localized title sits underneath as support. When the API has fallen back to title_fr
      // for a missing translation (API §4.9), the support line is omitted.
      function setTitles(primaryElement, supportElement, item) {
          primaryElement.textContent = item.title_fr || item.title;
          if (!item.title_fr) primaryElement.removeAttribute("lang");
          if (!item.title_fr || !item.title || item.title === item.title_fr) {
              supportElement.remove();
          } else {
              supportElement.textContent = item.title;
          }
      }

      // Keep displayed text, aria-valuenow, and --progress equal (same pattern as GrammarPage).
      function setProgress(track, percentElement, learned, total) {
          // Floor with integer math and clamp to 0-100: "100%" appears only when every unit is learned.
          const percent = total > 0 ? Math.min(100, Math.max(0, Math.floor((learned * 100) / total))) : 0;
          percentElement.textContent = `${percent}%`;
          track.setAttribute("aria-valuenow", String(percent));
          track.style.setProperty("--progress", `${percent}%`);
      }

      function renderTopic(topic) {
          const item = fromTemplate("topic-template");
          slot(item, "link").dataset.route = `/vocabulary/topics/${topic.slug}`;
          setTitles(slot(item, "title"), slot(item, "support"), topic);
          return item;
      }

      function renderCategory(category, index) {
          const section = fromTemplate("category-template");
          const topics = category.topics || [];
          const headingId = `category-${index + 1}-title`;
          section.setAttribute("aria-labelledby", headingId);
          slot(section, "heading").id = headingId;
          setTitles(slot(section, "title"), slot(section, "support"), category);
          slot(section, "count").textContent = t("vocab.topicsCount", { n: topics.length });
          const list = slot(section, "topics");
          list.append(...topics.map(renderTopic));
          list.hidden = topics.length === 0;
          slot(section, "empty").hidden = topics.length > 0;
          return section;
      }

      /* ---------- Page states ---------- */
      const content = document.querySelector("[data-vocabulary-content]");
      const overview = document.querySelector("[data-overview]");
      const categoryList = document.querySelector("[data-category-list]");
      const pageStates = document.querySelectorAll("[data-page-state]");

      function showPageState(state) {
          pageStates.forEach((element) => {
              element.hidden = element.dataset.pageState !== state;
          });
          content.hidden = state !== "content";
          overview.hidden = state !== "content";
      }

      let currentView = null;

      function render(data, progress = SAMPLE_VOCABULARY_PROGRESS) {
          currentView = { data, progress };
          const categories = data.categories || [];
          if (categories.length === 0) {
              showPageState("empty");
              return;
          }
          setProgress(
              slot(overview, "track"),
              slot(overview, "percent"),
              progress.learned,
              progress.total
          );
          slot(overview, "count").textContent = t("common.fraction", { learned: progress.learned, total: progress.total });
          slot(overview, "review-count").textContent = t("common.count", { n: progress.reviewLater });
          overview.classList.toggle(
              "is-complete",
              progress.total > 0 && progress.learned === progress.total
          );

          const topicCount = categories.reduce((sum, category) => sum + (category.topics || []).length, 0);
          document.querySelector("[data-summary]").replaceChildren(
              ...[
                  t("vocab.categoriesCount", { n: categories.length }),
                  t("vocab.topicsCount", { n: topicCount }),
              ].map((text) => {
                  const chip = document.createElement("li");
                  chip.className = "badge badge-info";
                  chip.textContent = text;
                  return chip;
              })
          );
          categoryList.replaceChildren(...categories.map(renderCategory));
          showPageState("content");
      }

      /* ---------- Preview states ---------- */
      if (preview === "loading") {
          showPageState("loading");
      } else if (preview === "error") {
          showPageState("error");
      } else if (preview === "empty") {
          render({ categories: [] });
      } else if (preview === "not-started") {
          render(SAMPLE_VOCABULARY, {
              learned: 0,
              total: SAMPLE_VOCABULARY_PROGRESS.total,
              reviewLater: 0,
          });
      } else {
          render(SAMPLE_VOCABULARY);
      }
      document.querySelector('[data-action="retry"]').addEventListener("click", () => render(SAMPLE_VOCABULARY));

      /* ---------- Language change: re-render this page's copy in place ---------- */
      onLanguageChange(() => {
          if (currentView) render(currentView.data, currentView.progress);
      });
  })();

}
