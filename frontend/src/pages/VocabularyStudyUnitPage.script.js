// Behavior carried over from the raw UI prototype (vocabulary-study-unit-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by VocabularyStudyUnitPage.jsx.
export default function init() {
  // UI preview only. No fetching, authentication, persistence, or routing is added here.
  // Production components receive this data from GET /api/v1/vocabulary/study-units/{slug}.
  (() => {
      const isEnglish = document.documentElement.lang.startsWith("en");
      const preview = new URLSearchParams(window.location.search).get("preview");

      // Fixed copy used by the script; production copy lives in the i18n dictionaries.
      const COPY = isEnglish
          ? {
              pageTitle: (title) => `Français Learning Journey | ${title}`,
              entries: (n) => `${n} word${n === 1 ? "" : "s"} and expression${n === 1 ? "" : "s"}`,
              marked: "Marked as learned.",
              unmarked: "Removed the learned mark.",
              saved: "Added to Review Later.",
              removed: "Removed from Review Later.",
              menuOpen: "Close navigation menu",
              menuClosed: "Navigation menu",
          }
          : {
              pageTitle: (title) => `Français Learning Journey | ${title}`,
              entries: (n) => `${n} từ và cụm từ`,
              marked: "Đã đánh dấu đã học.",
              unmarked: "Đã bỏ đánh dấu đã học.",
              saved: "Đã thêm vào Xem lại sau.",
              removed: "Đã bỏ khỏi Xem lại sau.",
              menuOpen: "Đóng menu điều hướng",
              menuClosed: "Menu điều hướng",
          };

      // Sample response in the shape of GET /api/v1/vocabulary/study-units/{slug}. Reuses the
      // sample curriculum of VocabularyPage / VocabularyTopicPage / Dashboard. The number of
      // entries is arbitrary: the sample is deliberately a little longer than the 10-15 entry
      // target to stress-test the layout, and the UI renders whatever entries[] contains.
      // Optional fields are null when absent, as the API returns them.
      const SAMPLE_UNIT = {
          slug: "pain-viennoiseries-1",
          title_fr: "Le pain et les viennoiseries — Partie 1",
          title: "Bánh mì và bánh ngọt — Phần 1",
          context: {
              category: { title_fr: "La nourriture et la restauration", title: "Ẩm thực và nhà hàng" },
              topic: { slug: "alimentation-1", title_fr: "L'alimentation (1)", title: "Thực phẩm (1)" },
              subtopic: { title_fr: "Le pain et les viennoiseries", title: "Bánh mì và bánh ngọt" },
          },
          entries: [
              { french: "le pain", meaning: "bánh mì", ipa: "pɛ̃", example_fr: "Je mange du pain avec le fromage.", example_translation: "Tôi ăn bánh mì với phô mai." },
              { french: "la baguette", meaning: "bánh mì baguette, ổ bánh mì dài và giòn kiểu Pháp", ipa: "ba.ɡɛt", example_fr: "Une baguette, s'il vous plaît.", example_translation: "Cho tôi một ổ bánh mì baguette." },
              { french: "le croissant", meaning: "bánh sừng bò", ipa: "kʁwa.sɑ̃", example_fr: "Il prend un croissant au petit-déjeuner.", example_translation: "Anh ấy ăn một chiếc bánh sừng bò vào bữa sáng." },
              { french: "le pain au chocolat", meaning: "bánh nhiều lớp nhân sô-cô-la", ipa: "pɛ̃ o ʃɔ.kɔ.la", example_fr: null, example_translation: null },
              { french: "la boulangerie", meaning: "tiệm bánh mì", ipa: "bu.lɑ̃ʒ.ʁi", example_fr: "La boulangerie ouvre à sept heures.", example_translation: "Tiệm bánh mì mở cửa lúc bảy giờ." },
              { french: "le boulanger, la boulangère", meaning: "thợ làm bánh mì, người bán bánh mì", ipa: null, example_fr: null, example_translation: null },
              { french: "la pâtisserie", meaning: "tiệm bánh ngọt; bánh ngọt", ipa: "pa.tis.ʁi", example_fr: null, example_translation: null },
              { french: "le pain complet", meaning: "bánh mì nguyên cám", ipa: null, example_fr: null, example_translation: null },
              { french: "le pain de campagne", meaning: "bánh mì đồng quê", ipa: null, example_fr: "Ce pain de campagne est délicieux.", example_translation: "Chiếc bánh mì đồng quê này rất ngon." },
              { french: "la mie", meaning: "ruột bánh mì", ipa: "mi", example_fr: null, example_translation: null },
              { french: "la croûte", meaning: "vỏ bánh mì", ipa: "kʁut", example_fr: "La croûte est bien croustillante.", example_translation: "Vỏ bánh rất giòn." },
              { french: "croustillant, croustillante", meaning: "giòn", ipa: null, example_fr: null, example_translation: null },
              { french: "frais, fraîche", meaning: "tươi, mới ra lò", ipa: null, example_fr: null, example_translation: null },
              { french: "le beurre", meaning: "bơ", ipa: "bœʁ", example_fr: null, example_translation: null },
              { french: "la brioche", meaning: "bánh brioche, bánh mì ngọt mềm nhiều bơ và trứng", ipa: null, example_fr: "Les enfants adorent la brioche.", example_translation: "Trẻ em rất thích bánh brioche." },
              { french: "l'éclair au chocolat", meaning: "bánh éclair nhân sô-cô-la", ipa: null, example_fr: "Je voudrais un éclair au chocolat.", example_translation: "Tôi muốn một chiếc bánh éclair sô-cô-la." },
              { french: "la tarte aux pommes", meaning: "bánh tart táo", ipa: null, example_fr: "Elle achète une tarte aux pommes pour le dessert.", example_translation: "Cô ấy mua một chiếc bánh tart táo cho món tráng miệng." },
              { french: "la farine", meaning: "bột mì", ipa: null, example_fr: null, example_translation: null },
          ],
          // Same state as this Study Unit on VocabularyTopicPage's sample.
          state: { learned: true, review_later: false },
      };

      // Static demo neighbors, only to show the UI. The API has no previous/next fields:
      // production derives them from the curriculum order the existing browse endpoints
      // already return (same approach as GrammarLessonPage). A side with no neighbor renders
      // as an unavailable card. No new endpoint is assumed.
      const SAMPLE_NEIGHBORS = {
          previous: {
              slug: "fruits-legumes-2",
              title_fr: "Les fruits et légumes — Partie 2",
              title: "Trái cây và rau củ — Phần 2",
          },
          next: {
              slug: "pain-viennoiseries-2",
              title_fr: "Le pain et les viennoiseries — Partie 2",
              title: "Bánh mì và bánh ngọt — Phần 2",
          },
      };

      /* ---------- Rendering helpers ---------- */
      const page = document.querySelector("[data-unit]");
      const article = document.querySelector("[data-unit-content]");
      const actions = article.querySelector(".unit-actions");

      function slot(root, name) {
          return root.querySelector(`[data-slot="${name}"]`);
      }

      // French is the target language: title_fr is the primary title (lang="fr") and the
      // localized title supports it. When the API has fallen back to title_fr for a missing
      // translation (API §4.9), the support line is hidden rather than repeated.
      function setTitles(primary, support, item, supportPrefix = "") {
          primary.textContent = item.title_fr || item.title;
          if (item.title_fr) primary.setAttribute("lang", "fr");
          else primary.removeAttribute("lang");
          const hasSupport = Boolean(item.title_fr && item.title && item.title !== item.title_fr);
          support.hidden = !hasSupport;
          support.textContent = hasSupport ? `${supportPrefix}${item.title}` : "";
      }

      // Optional entry fields that are null are removed, never rendered as placeholders.
      function renderEntry(entry) {
          const item = document.getElementById("entry-template").content.firstElementChild.cloneNode(true);
          slot(item, "french").textContent = entry.french;
          slot(item, "meaning").textContent = entry.meaning;

          if (entry.ipa) slot(item, "ipa-text").textContent = `/${entry.ipa}/`;
          else slot(item, "ipa").remove();

          if (entry.example_fr) {
              slot(item, "example-fr").textContent = entry.example_fr;
              if (entry.example_translation) slot(item, "example-translation").textContent = entry.example_translation;
              else slot(item, "example-translation").remove();
          } else {
              slot(item, "example").remove();
          }
          return item;
      }

      /* ---------- Learner state ---------- */
      let state = { learned: false, review_later: false };

      function renderState({ announce, focus } = {}) {
          const { learned, review_later: saved } = state;
          page.classList.toggle("is-learned", learned);
          page.classList.toggle("is-saved", saved);

          const header = article.querySelector(".unit-header");
          slot(header, "badge-learned").hidden = !learned;
          slot(header, "badge-review").hidden = !saved;

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
      // changed field and renders the `state` from the response. The frontend is not the
      // authority for learner state.
      const ACTIONS = {
          "mark-learned": { change: { learned: true }, announce: COPY.marked, focus: "unmark-learned" },
          "unmark-learned": { change: { learned: false }, announce: COPY.unmarked, focus: "mark-learned" },
          "save-review": { change: { review_later: true }, announce: COPY.saved, focus: "remove-review" },
          "remove-review": { change: { review_later: false }, announce: COPY.removed, focus: "save-review" },
      };

      actions.addEventListener("click", (event) => {
          const button = event.target.closest("button[data-action]");
          const action = button && ACTIONS[button.dataset.action];
          if (!action) return;
          state = { ...state, ...action.change };
          renderState(action);
      });

      /* ---------- Previous / Next Study Unit navigation ---------- */
      // Fills one side. With no neighbor the slot is kept and rendered unavailable: no href
      // (so it is neither focusable nor navigable), aria-disabled, and neutral copy.
      const UNAVAILABLE_COPY = isEnglish
          ? { previous: "No previous lesson", next: "No next lesson" }
          : { previous: "Không có bài trước", next: "Không có bài tiếp theo" };

      function fillNavLink(link, neighbor, side) {
          const title = slot(link, "title");
          const support = slot(link, "support");
          if (!neighbor) {
              link.removeAttribute("href");
              link.removeAttribute("data-route");
              link.setAttribute("role", "link");
              link.setAttribute("aria-disabled", "true");
              title.removeAttribute("lang");
              title.textContent = UNAVAILABLE_COPY[side];
              support.hidden = true;
              support.textContent = "";
              return;
          }
          link.setAttribute("href", "#");
          link.removeAttribute("role");
          link.removeAttribute("aria-disabled");
          link.dataset.route = `/vocabulary/study-units/${neighbor.slug}`;
          setTitles(title, support, neighbor);
      }

      function renderUnitNav({ previous, next }) {
          const nav = document.querySelector("[data-unit-nav]");
          fillNavLink(slot(nav, "nav-previous"), previous, "previous");
          fillNavLink(slot(nav, "nav-next"), next, "next");
      }

      /* ---------- Study Unit ---------- */
      function renderUnit(unit, neighbors = SAMPLE_NEIGHBORS) {
          document.title = COPY.pageTitle(unit.title_fr || unit.title);
          const entries = unit.entries || [];

          const header = article.querySelector(".unit-header");
          setTitles(slot(header, "title"), slot(header, "support"), unit);
          slot(header, "count").textContent = COPY.entries(entries.length);

          // Subtopic: contextual label only (no route, no slug).
          const context = slot(header, "context");
          setTitles(slot(context, "title"), slot(context, "support"), unit.context.subtopic, " · ");

          const crumbs = document.querySelector(".breadcrumb-list");
          const categoryCrumb = crumbs.querySelector('[data-crumb="category"]');
          const topicCrumb = crumbs.querySelector('[data-crumb="topic"]');
          const unitCrumb = crumbs.querySelector('[data-crumb="unit"]');
          setTitles(slot(categoryCrumb, "title"), slot(categoryCrumb, "support"), unit.context.category, "· ");
          slot(topicCrumb, "title").textContent = unit.context.topic.title_fr || unit.context.topic.title;
          slot(topicCrumb, "topic-link").dataset.route = `/vocabulary/topics/${unit.context.topic.slug}`;
          slot(unitCrumb, "title").textContent = unit.title_fr || unit.title;

          slot(actions, "practice").dataset.route = `/practice/${unit.slug}`;

          const list = document.querySelector("[data-entry-list]");
          list.replaceChildren(...entries.map(renderEntry));
          list.hidden = entries.length === 0;
          document.querySelector("[data-entry-empty]").hidden = entries.length > 0;

          renderUnitNav(neighbors);

          state = { ...unit.state };
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
          // Without Study Unit data only the Từ vựng crumb is known.
          contextCrumbs.forEach((crumb) => {
              crumb.hidden = stateName !== "content";
          });
      }

      function showSample() {
          let unit = SAMPLE_UNIT;
          const previewStates = {
              "not-learned": { learned: false, review_later: false },
              review: { learned: false, review_later: true },
              both: { learned: true, review_later: true },
          };
          if (previewStates[preview]) unit = { ...unit, state: previewStates[preview] };
          if (preview === "short") unit = { ...unit, entries: unit.entries.slice(0, 5) };
          if (preview === "empty") unit = { ...unit, entries: [] };
          const neighbors = {
              first: { previous: null, next: SAMPLE_NEIGHBORS.next },
              last: { previous: SAMPLE_NEIGHBORS.previous, next: null },
          }[preview] || SAMPLE_NEIGHBORS;
          renderUnit(unit, neighbors);
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
