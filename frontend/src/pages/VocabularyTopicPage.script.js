// Behavior carried over from the raw UI prototype (vocabulary-topic-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by VocabularyTopicPage.jsx.
export default function init({ getLanguage, onLanguageChange } = {}) {
  // UI preview only. No fetching, authentication, or routing is added here.
  // Production components receive this data from GET /api/v1/vocabulary/topics/{topic_slug}
  // (API Contract §10.2).
  (() => {
      let isEnglish = getLanguage() === "en";
      const preview = new URLSearchParams(window.location.search).get("preview");

      // Fixed copy used by the script; production copy lives in the i18n dictionaries.
      const buildCopy = (isEnglish) => isEnglish
          ? {
              summary: (s, u) => [`${s} mục`, `${u} bài`],
              menuOpen: "Close navigation menu",
              menuClosed: "Navigation menu",
              units: (learned, total) =>
                  `${learned}/${total} unit${total === 1 ? "" : "s"}`,

              saved: (n) =>
                  `${n} unit${n === 1 ? "" : "s"}`,

              progressOf: (title) =>
                  `Progress: ${title}`,
          }
          : {
              summary: (s, u) => [`${s} mục`, `${u} bài`],
              menuOpen: "Đóng menu điều hướng",
              menuClosed: "Menu điều hướng",
              units: (learned, total) => `${learned}/${total} bài`,
              saved: (n) => `${n} bài`,
              progressOf: (title) => `Tiến độ ${title}`,
          };
      let COPY = buildCopy(isEnglish);

      // Sample response in the shape of GET /api/v1/vocabulary/topics/{topic_slug}. Reuses
      // VocabularyPage's own sample Category/Topic (categories[0].topics[0], slug
      // "alimentation-1") and Dashboard's Recent Practice Study Unit slug
      // ("pain-viennoiseries-1"), so the sample curriculum agrees across prototypes instead
      // of inventing an unrelated one. Titles/counts are sample curriculum data; the layout
      // must not depend on these particular values.
      const SAMPLE_TOPIC = {
          slug: "alimentation-1",
          title_fr: "L'alimentation (1)",
          title: "Thực phẩm (1)",
          context: {
              category: {
                  title_fr: "La nourriture et la restauration",
                  title: "Ẩm thực và nhà hàng",
              },
          },
          subtopics: [
              {
                  title_fr: "Le pain et les viennoiseries",
                  title: "Bánh mì và bánh ngọt",
                  study_units: [
                      {
                          slug: "pain-viennoiseries-1",
                          title_fr: "Le pain et les viennoiseries — Partie 1",
                          title: "Bánh mì và bánh ngọt — Phần 1",
                          learned: true,
                          review_later: false,
                      },
                      {
                          slug: "pain-viennoiseries-2",
                          title_fr: "Le pain et les viennoiseries — Partie 2",
                          title: "Bánh mì và bánh ngọt — Phần 2",
                          learned: true,
                          review_later: true,
                      },
                      {
                          slug: "pain-viennoiseries-3",
                          title_fr: "Le pain et les viennoiseries — Partie 3",
                          title: "Bánh mì và bánh ngọt — Phần 3",
                          learned: false,
                          review_later: false,
                      },
                  ],
              },
              {
                  title_fr: "Les boissons",
                  title: "Đồ uống",
                  study_units: [
                      {
                          slug: "boissons-1",
                          title_fr: "Les boissons",
                          title: "Đồ uống",
                          learned: false,
                          review_later: true,
                      },
                  ],
              },
              {
                  title_fr: "Les fruits et légumes",
                  title: "Trái cây và rau củ",
                  study_units: [
                      {
                          slug: "fruits-legumes-1",
                          title_fr: "Les fruits et légumes — Partie 1",
                          title: "Trái cây và rau củ — Phần 1",
                          learned: true,
                          review_later: false,
                      },
                      {
                          slug: "fruits-legumes-2",
                          title_fr: "Les fruits et légumes — Partie 2",
                          title: "Trái cây và rau củ — Phần 2",
                          learned: false,
                          review_later: false,
                      },
                  ],
              },
              {
                  title_fr: "Les boissons, le café et le thé : commander, préparer et décrire au restaurant et à la maison",
                  title: "Đồ uống, cà phê và trà: gọi món, pha chế và mô tả ở nhà hàng và tại nhà",
                  study_units: [
                      {
                          slug: "boissons-cafe-the-1",
                          title_fr: "Les boissons, le café et le thé — Partie 1",
                          title: "Đồ uống, cà phê và trà — Phần 1",
                          learned: true,
                          review_later: true,
                      },
                      {
                          slug: "boissons-cafe-the-2",
                          title_fr: "Les boissons, le café et le thé — Partie 2",
                          title: "Đồ uống, cà phê và trà — Phần 2",
                          learned: false,
                          review_later: false,
                      },
                      {
                          slug: "boissons-cafe-the-3",
                          title_fr: "Les boissons, le café et le thé — Partie 3",
                          title: "Đồ uống, cà phê và trà — Phần 3",
                          learned: false,
                          review_later: false,
                      },
                  ],
              },
              {
                  title_fr: "Les produits laitiers",
                  title: "Các sản phẩm từ sữa",
                  study_units: [
                      {
                          slug: "produits-laitiers",
                          title_fr: "Les produits laitiers",
                          title: "Các sản phẩm từ sữa",
                          learned: false,
                          review_later: true,
                      },
                  ],
              },
              {
                  title_fr: "Les épices et les condiments",
                  title: "Gia vị và nước chấm",
                  study_units: [
                      {
                          slug: "epices-condiments",
                          title_fr: "Les épices et les condiments",
                          title: "Gia vị và nước chấm",
                          learned: false,
                          review_later: false,
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
      function setTitles(primaryElement, supportElement, item, supportPrefix = "") {
          primaryElement.textContent = item.title_fr || item.title;
          if (!item.title_fr) primaryElement.removeAttribute("lang");
          if (!item.title_fr || !item.title || item.title === item.title_fr) {
              supportElement.remove();
          } else {
              supportElement.textContent = `${supportPrefix}${item.title}`;
          }
      }

      function setProgress(track, percentElement, learned, total) {
          const percent =
              total > 0
                  ? Math.round((learned / total) * 100)
                  : 0;

          percentElement.textContent = `${percent}%`;
          track.setAttribute("aria-valuenow", String(percent));
          track.style.setProperty("--progress", `${percent}%`);
      }

      function renderStudyUnit(unit) {
          const item = fromTemplate("study-unit-template");
          const link = slot(item, "link");
          link.dataset.route = `/vocabulary/study-units/${unit.slug}`;
          link.classList.toggle("is-learned", unit.learned);
          link.classList.toggle("is-saved", unit.review_later);
          // Status icon shows the higher-priority state: Review Later > Learned > none.
          slot(item, "status").textContent = unit.learned ? "check_circle" : "radio_button_unchecked";
          setTitles(slot(item, "title"), slot(item, "support"), unit);
          slot(item, "learned").hidden = !unit.learned;
          slot(item, "learned").classList.toggle("badge-quiet", unit.learned && unit.review_later);
          slot(item, "review-later").hidden = !unit.review_later;
          slot(item, "meta").hidden = !unit.learned && !unit.review_later;
          return item;
      }

      function renderSubtopic(subtopic, index) {
          const section = fromTemplate("subtopic-template");
          const units = subtopic.study_units || [];
          const learned = units.filter(
              (unit) => unit.learned
          ).length;
          const headingId = `subtopic-${index + 1}-title`;
          section.setAttribute("aria-labelledby", headingId);
          slot(section, "heading").id = headingId;
          setTitles(slot(section, "title"), slot(section, "support"), subtopic);
          slot(section, "count").textContent =
              COPY.units(learned, units.length);
          const list = slot(section, "units");
          list.append(...units.map(renderStudyUnit));
          list.hidden = units.length === 0;
          slot(section, "empty").hidden = units.length > 0;
          return section;
      }

      /* ---------- Page states ---------- */
      const content = document.querySelector("[data-topic-content]");
      const overview = document.querySelector("[data-overview]");
      const subtopicList = document.querySelector("[data-subtopic-list]");
      const pageStates = document.querySelectorAll("[data-page-state]");
      const contextCrumb = document.querySelector('[data-crumb="category"]');
      const topicCrumb = document.querySelector('[data-crumb="topic"]');

      function showPageState(state) {
          pageStates.forEach((element) => {
              element.hidden = element.dataset.pageState !== state;
          });
          content.hidden = state !== "content";
          contextCrumb.hidden = state !== "content";
          topicCrumb.hidden = state !== "content";
      }

      let currentTopic = null;

      function render(topic) {
          currentTopic = topic;
          document.title = `Français Learning Journey | ${topic.title_fr || topic.title}`;

          setTitles(slot(contextCrumb, "title"), slot(contextCrumb, "support"), topic.context.category, " · ");
          slot(topicCrumb, "title").textContent = topic.title_fr || topic.title;

          setTitles(document.querySelector("#topic-title"), slot(document.querySelector(".topic-header"), "support"), topic);

          const subtopics = topic.subtopics || [];

          const units = subtopics.flatMap(
              (subtopic) => subtopic.study_units || []
          );

          const learned = units.filter(
              (unit) => unit.learned
          ).length;

          const reviewLater = units.filter(
              (unit) => unit.review_later
          ).length;

          const unitCount = units.length;

          setProgress(
              slot(overview, "track"),
              slot(overview, "percent"),
              learned,
              unitCount
          );

          slot(overview, "count").textContent =
              COPY.units(learned, unitCount);

          slot(overview, "review-count").textContent =
              COPY.saved(reviewLater);

          overview.classList.toggle(
              "is-complete",
              unitCount > 0 && learned === unitCount
          );

          slot(overview, "track").setAttribute(
              "aria-label",
              COPY.progressOf(topic.title_fr || topic.title)
          );

          document.querySelector("[data-summary]").replaceChildren(
              ...COPY.summary(subtopics.length, unitCount).map((text) => {
                  const chip = document.createElement("li");
                  chip.className = "badge badge-info";
                  chip.textContent = text;
                  return chip;
              })
          );

          subtopicList.replaceChildren(...subtopics.map(renderSubtopic));
          subtopicList.hidden = subtopics.length === 0;
          document.querySelector("[data-summary]").hidden = subtopics.length === 0;
          document.querySelector("[data-topic-empty]").hidden = subtopics.length > 0;

          showPageState("content");
      }

      /* ---------- Preview states ---------- */
      if (preview === "loading") {
          showPageState("loading");
      } else if (preview === "error") {
          showPageState("error");
      } else if (preview === "empty") {
          render({ ...SAMPLE_TOPIC, subtopics: [] });
      } else {
          render(SAMPLE_TOPIC);
      }
      document.querySelector('[data-action="retry"]').addEventListener("click", () => render(SAMPLE_TOPIC));

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
      /* ---------- Language change: re-render this page's copy in place ---------- */
      onLanguageChange((language) => {
          isEnglish = language === "en";
          COPY = buildCopy(isEnglish);
          if (currentTopic) render(currentTopic);
          setMenu(!mobileNav.hidden);
      });
  })();

}
