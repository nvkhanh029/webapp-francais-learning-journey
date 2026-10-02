// Behavior carried over from the raw UI prototype (review-later.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by ReviewLaterPage.jsx.
export default function init({ getLanguage, onLanguageChange } = {}) {
  // UI preview only. No fetching, persistence or routing is added here.
  // Production: ReviewLaterPage gets items from GET /api/v1/me/review-later and removes an
  // item with PATCH /api/v1/me/learning-units/{slug}/state { "review_later": false }.
  (() => {
      let isEnglish = getLanguage() === "en";
      const preview = new URLSearchParams(window.location.search).get("preview");

      // Fixed copy used by the script; production copy lives in the i18n dictionaries.
      const buildCopy = (isEnglish) => isEnglish
          ? {
              total: (n) => `${n} saved lesson${n === 1 ? "" : "s"}`,
              groupCount: (n) => `${n} lesson${n === 1 ? "" : "s"}`,
              learned: "Learned",
              open: "View lesson",
              remove: "Remove",
              removeContext: (title) => ` ${title} from Review Later`,
              removed: "Removed from Review Later",
              menuOpen: "Close navigation menu",
              menuClosed: "Navigation menu",
              modules: { grammar: "Grammar", vocabulary: "Vocabulary", conjugation: "Conjugation" },
          }
          : {
              total: (n) => `${n} bài đã lưu`,
              groupCount: (n) => `${n} bài`,
              learned: "Đã học",
              open: "Xem bài học",
              remove: "Bỏ lưu",
              removeContext: (title) => ` ${title} khỏi Xem lại sau`,
              removed: "Đã bỏ khỏi Xem lại sau",
              menuOpen: "Đóng menu điều hướng",
              menuClosed: "Menu điều hướng",
              modules: { grammar: "Ngữ pháp", vocabulary: "Từ vựng", conjugation: "Chia động từ" },
          };
      let COPY = buildCopy(isEnglish);

      // Presentation config. The frontend maps unit_type to a module group and a route.
      // Group order follows the Review Later wireframe (FD §7.14).
      const MODULES = [
          { type: "grammar", subject: "subject-grammar", icon: "draw", route: (slug) => `/grammar/lessons/${slug}` },
          { type: "vocabulary", subject: "subject-vocabulary", icon: "style", route: (slug) => `/vocabulary/study-units/${slug}` },
          { type: "conjugation", subject: "subject-conjugation", icon: "schedule", route: (slug) => `/conjugation/lessons/${slug}` },
      ];

      // Shape of GET /api/v1/me/review-later (data.items[]). `title` is already localized by the API.
      const SAMPLE_ITEMS = [
          { slug: "articles-definis", unit_type: "grammar", title_fr: "Les articles définis", title: "Mạo từ xác định", learned: true },
          { slug: "adjectifs-qualificatifs-accord", unit_type: "grammar", title_fr: "Les adjectifs qualificatifs et leur accord", title: "Tính từ miêu tả và sự hòa hợp giống, số", learned: false },
          { slug: "bus-autocar-1", unit_type: "vocabulary", title_fr: "Le bus et l'autocar — Partie 1", title: "Xe buýt nội đô và xe khách liên tỉnh — Phần 1", learned: true },
          { slug: "pain-viennoiseries-1", unit_type: "vocabulary", title_fr: "Le pain et les viennoiseries — Partie 1", title: "Bánh mì và bánh ngọt kiểu Pháp — Phần 1", learned: false },
          { slug: "present-regular-er", unit_type: "conjugation", title_fr: "Les verbes réguliers en -ER au présent", title: "Động từ có quy tắc đuôi -ER ở thì hiện tại", learned: true },
          { slug: "passe-compose-avoir", unit_type: "conjugation", title_fr: "Le passé composé avec l'auxiliaire avoir", title: "Thì quá khứ kép với trợ động từ avoir", learned: false },
      ];

      // Prototype-only English titles, standing in for the API's localized `title` when lang="en".
      const EN_TITLES = {
          "articles-definis": "Definite articles",
          "adjectifs-qualificatifs-accord": "Descriptive adjectives and their agreement",
          "bus-autocar-1": "City buses and coaches — Part 1",
          "pain-viennoiseries-1": "Bread and viennoiseries — Part 1",
          "present-regular-er": "Regular -ER verbs in the present tense",
          "passe-compose-avoir": "The passé composé with the auxiliary avoir",
      };

      function samplePreview() {
          let items = SAMPLE_ITEMS.map((item) => ({ ...item, title: isEnglish ? EN_TITLES[item.slug] : item.title }));
          if (preview === "single") items = items.slice(3, 4);
          if (preview === "empty") items = [];
          if (preview === "long-titles") {
              items = items.slice(0, 3).map((item, index) => ({
                  ...item,
                  title_fr: index === 0
                      ? "Les articles définis, indéfinis et partitifs : emploi, accord et cas particuliers après la négation"
                      : `${item.title_fr} : Supercalifragilisticexpialidocieusement-long-mot-sans-espaces`,
                  title: `${item.title} — ${isEnglish ? "an intentionally long localized title that must wrap without clipping or pushing the actions off screen" : "một tiêu đề bản địa hóa cố ý rất dài, cần xuống dòng tự nhiên mà không bị cắt hay đẩy nút thao tác ra ngoài"}`,
              }));
          }
          return items;
      }

      let items = samplePreview();

      const content = document.querySelector("[data-review-content]");
      const total = document.querySelector("[data-total]");
      const pageStates = document.querySelectorAll("[data-page-state]");
      const groupTemplate = document.getElementById("group-template");
      const itemTemplate = document.getElementById("item-template");

      /* ---------- Rendering: page state first, then groups derived from items[] ---------- */
      let currentState = "content";

      function showState(state) {
          currentState = state;
          pageStates.forEach((element) => {
              element.hidden = element.dataset.pageState !== state;
          });
          content.hidden = state !== "content";
          // The count is only meaningful with a loaded, non-empty list.
          total.hidden = state !== "content";
      }

      function renderItem(item, module) {
          const row = itemTemplate.content.firstElementChild.cloneNode(true);
          const set = (slot, text) => { row.querySelector(`[data-slot="${slot}"]`).textContent = text; };
          row.dataset.slug = item.slug;
          set("title-fr", item.title_fr);
          // API §4.9: when the localized title equals title_fr (fallback) it is hidden, not repeated.
          const supportLine = row.querySelector('[data-slot="title"]');
          const hasSupport = Boolean(item.title_fr && item.title && item.title !== item.title_fr);
          supportLine.hidden = !hasSupport;
          supportLine.textContent = hasSupport ? item.title : "";
          row.querySelector('[data-slot="learned"]').hidden = !item.learned;
          set("learned-text", COPY.learned);

          const open = row.querySelector('[data-slot="open"]');
          open.dataset.route = module.route(item.slug);
          set("open-text", COPY.open);
          // Repeated link text needs context; the French title keeps its own language.
          const openContext = row.querySelector('[data-slot="open-context"]');
          openContext.append(" ");
          const frOpen = document.createElement("span");
          frOpen.lang = "fr";
          frOpen.textContent = item.title_fr;
          openContext.append(frOpen);

          set("remove-text", COPY.remove);
          const removeContext = row.querySelector('[data-slot="remove-context"]');
          const [before, after = ""] = COPY.removeContext("\u0000").split("\u0000");
          removeContext.append(before);
          const frRemove = document.createElement("span");
          frRemove.lang = "fr";
          frRemove.textContent = item.title_fr;
          removeContext.append(frRemove, after);
          return row;
      }

      function render() {
          total.textContent = COPY.total(items.length);
          if (items.length === 0) {
              content.replaceChildren();
              showState("empty");
              return;
          }
          const fragment = document.createDocumentFragment();
          MODULES.forEach((module) => {
              const moduleItems = items.filter((item) => item.unit_type === module.type);
              if (moduleItems.length === 0) return; // Omit empty module groups.
              const group = groupTemplate.content.firstElementChild.cloneNode(true);
              group.classList.add(module.subject);
              group.dataset.group = module.type;
              const titleId = `heading-${module.type}`;
              group.setAttribute("aria-labelledby", titleId);
              group.querySelector('[data-slot="icon"]').textContent = module.icon;
              const title = group.querySelector('[data-slot="title"]');
              title.id = titleId;
              title.textContent = COPY.modules[module.type];
              group.querySelector('[data-slot="count"]').textContent = COPY.groupCount(moduleItems.length);
              group.querySelector('[data-slot="items"]').append(...moduleItems.map((item) => renderItem(item, module)));
              fragment.append(group);
          });
          content.replaceChildren(fragment);
          showState("content");
      }

      /* ---------- Prototype-only removal: hides the sample row, no persistence ---------- */
      let toastTimer = null;
      function showToast(message) {
          const toast = document.getElementById("toast");
          document.getElementById("toast-message").textContent = message;
          toast.classList.add("is-visible");
          clearTimeout(toastTimer);
          toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
      }

      content.addEventListener("click", (event) => {
          const button = event.target.closest('[data-action="remove-review"]');
          if (!button) return;
          const row = button.closest("[data-item]");
          const group = row.closest("[data-group]");
          const rows = [...group.querySelectorAll("[data-item]")];
          const index = rows.indexOf(row);
          // Keep keyboard focus in the list: next row, else previous row, else next group, else heading.
          const neighbour = rows[index + 1] || rows[index - 1];
          const nextGroup = group.nextElementSibling || group.previousElementSibling;

          items = items.filter((item) => item.slug !== row.dataset.slug);
          render();
          showToast(COPY.removed);

          if (items.length === 0) {
              document.querySelector('[data-page-state="empty"] .page-state-title').focus();
              return;
          }
          const target = neighbour
              ? content.querySelector(`[data-slug="${neighbour.dataset.slug}"] [data-action="remove-review"]`)
              : nextGroup && content.querySelector(`[data-group="${nextGroup.dataset.group}"] [data-action="remove-review"]`);
          (target || document.querySelector(".review-page-title")).focus();
      });

      document.querySelector('[data-action="retry-page"]').addEventListener("click", () => {
          items = samplePreview();
          render();
      });

      if (preview === "loading") showState("loading");
      else if (preview === "error") showState("error");
      else render();

      /* ---------- Compact navigation menu (FD §8.5), same behavior as the Dashboard ---------- */
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
          // Rebuild titles for the new language; keep the rows the learner already removed.
          const remaining = new Set(items.map((item) => item.slug));
          items = samplePreview().filter((item) => remaining.has(item.slug));
          if (currentState === "content" || currentState === "empty") render();
          setMenu(!mobileNav.hidden);
      });
  })();

}
