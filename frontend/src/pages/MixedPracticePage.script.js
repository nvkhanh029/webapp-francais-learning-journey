// Behavior carried over from the raw UI prototype (practice-mix.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by MixedPracticePage.jsx.
import { t } from "../i18n/index.js";

export default function init({ onLanguageChange } = {}) {
  // PROTOTYPE ONLY. UI preview: no fetching, scoring, random selection, eligibility logic,
  // authentication, routing or persistence is added here.
  // Production: useMixedPractice() calls POST /api/v1/mixed-practice/start, then owns
  // questions / answers / phase / result (FD §5.6, §5.8). The backend is authoritative for eligibility,
  // question selection, scoring, streak and Content Covered.
  (() => {
      const preview = new URLSearchParams(window.location.search).get("preview");
      const $ = (selector, root = document) => root.querySelector(selector);
      const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
      const langAttr = () => document.documentElement.lang;
      const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

      /* ---------- Fixed copy: read from src/i18n/strings.js each time it is used ---------- */
      const TYPE_LABEL_KEY = { mcq: "practice.typeMcq", fill_blank: "practice.typeFill", ordering: "practice.typeOrdering" };
      const INSTRUCTION_KEY = { mcq: "practice.instructionMcq", fill_blank: "practice.instructionFill", ordering: "practice.instructionOrdering" };
      const typeLabel = (type) => t(TYPE_LABEL_KEY[type]);
      const FRENCH_CHARS = ["é", "è", "ê", "à", "â", "ç", "î", "ô", "œ"];

      /* ---------- Sample Mixed Practice Start response: practice_type "mixed", total_questions and
           questions[]. The session size is data-driven: this sample has 7 questions, not 10, and
           the UI below follows QUESTIONS.length. Question objects carry no source unit and no
           correct answers, as in the real Start response. ---------- */
      const QUESTIONS = [
          { type: "mcq", prompt: "Je ______ français avec mes amis tous les jours.", options: ["parle", "parles", "parlons", "parlent"] },
          { type: "fill_blank", prompt: "Nous ______ (habiter) à Paris depuis deux ans." },
          { type: "ordering", translation: "Tôi thích học tiếng Pháp.", pieces: ["le", "J'", "français", "apprendre", "aime"] },
          { type: "fill_blank", prompt: "Il y a ______ fleurs dans le jardin. (un / une / des)" },
          { type: "mcq", prompt: "Vous ______ le dîner à quelle heure ? (manger)", options: ["mangez", "manges", "mangent", "mangeons"] },
          { type: "mcq", prompt: "Je prends le ______ pour aller au travail.", options: ["métro", "stylo", "fromage", "jardin"] },
          { type: "ordering", translation: "Chúng tôi đi đến nhà ga bằng xe khách.", pieces: ["gare", "Nous", "en", "allons", "autocar", "à", "la"] },
      ];

      /* ---------- Sample Submit response, rendered as-is. The prototype never scores answers (FD §3.3).
           content_covered lists the DISTINCT learning units represented by this session:
           { slug, unit_type, title_fr, title (localized) }. ---------- */
      const SAMPLE_RESULT = {
          correct_count: 5,
          total_questions: 7,
          accuracy: 71,
          content_covered: [
              { slug: "present-regular-er", unit_type: "conjugation", title_fr: "Les verbes réguliers en -ER", title: "Động từ có quy tắc đuôi -ER" },
              { slug: "articles-definis", unit_type: "grammar", title_fr: "Les articles définis", title: "Mạo từ xác định" },
              { slug: "articles-indefinis", unit_type: "grammar", title_fr: "Les articles indéfinis", title: "Mạo từ bất định" },
              { slug: "transports-1", unit_type: "vocabulary", title_fr: "Les transports en ville", title: "Phương tiện giao thông trong thành phố" },
          ],
          questions: [
              { is_correct: true, learner_answer: "parle", correct_answer: "parle", explanation: "Với je, động từ đuôi -ER bỏ -er và thêm -e: je parle." },
              { is_correct: true, learner_answer: "habitons", correct_answer: "habitons", explanation: "Với nous, thêm -ons vào gốc động từ: nous habitons." },
              { is_correct: true, learner_answer: "J'aime apprendre le français", correct_answer: "J'aime apprendre le français", explanation: "Chủ ngữ J' đứng đầu, sau đó là động từ aimer và động từ nguyên mẫu apprendre." },
              { is_correct: false, learner_answer: "les", correct_answer: "des", explanation: "Fleurs là danh từ số nhiều, nên mạo từ bất định là des: il y a des fleurs." },
              { is_correct: true, learner_answer: "mangez", correct_answer: "mangez", explanation: "Với vous, thêm -ez: vous mangez." },
              { is_correct: true, learner_answer: "métro", correct_answer: "métro", explanation: "Le métro là phương tiện giao thông công cộng đi lại trong thành phố." },
              { is_correct: false, learner_answer: "Nous allons en autocar à la gare", correct_answer: "Nous allons à la gare en autocar", explanation: "Địa điểm đến (à la gare) đứng trước phương tiện (en autocar)." },
          ],
      };

      /* Content Covered grouping and supported learning routes (no Mixed-specific routes exist). */
      const UNIT_GROUPS = [
          { type: "grammar", labelKey: "common.grammar", icon: "draw", cls: "subject-grammar", route: (slug) => `/grammar/lessons/${slug}` },
          { type: "vocabulary", labelKey: "common.vocabulary", icon: "style", cls: "subject-vocabulary", route: (slug) => `/vocabulary/study-units/${slug}` },
          { type: "conjugation", labelKey: "common.conjugation", icon: "schedule", cls: "subject-conjugation", route: (slug) => `/conjugation/lessons/${slug}` },
      ];

      /* ---------- Temporary Practice state (never persisted, FD §5.8) ---------- */
      // answers[i]: mcq -> option text; fill_blank -> string; ordering -> array of placed piece indexes.
      let answers = {};
      let current = 0;
      let phase = "prestart";
      let touched = {};
      let startTimer = null;
      const total = QUESTIONS.length;

      // Demo answers that match SAMPLE_RESULT.learner_answer (ordering: indexes into pieces).
      const DEMO_ANSWERS = {
          0: "parle", 1: "habitons",
          2: [1, 4, 3, 0, 2], // J' aime apprendre le français
          3: "les", 4: "mangez", 5: "métro",
          6: [1, 3, 2, 4, 5, 6, 0], // Nous allons en autocar à la gare
      };

      function isAnswered(i) {
          const q = QUESTIONS[i];
          const a = answers[i];
          if (q.type === "ordering") return Array.isArray(a) && a.length === q.pieces.length;
          if (q.type === "fill_blank") return typeof a === "string" && a.trim() !== "";
          return Boolean(a);
      }
      const answeredCount = () => QUESTIONS.reduce((n, _, i) => n + (isAnswered(i) ? 1 : 0), 0);

      function answerText(i) {
          const q = QUESTIONS[i];
          const a = answers[i];
          if (q.type === "ordering") return (a || []).map((p) => q.pieces[p]).join(" ").replace(/' /g, "'");
          return a || "";
      }

      // "______" in an API prompt becomes a visible blank with a text alternative.
      function promptHtml(q) {
          if (q.type === "ordering") {
              return `<span class="prompt-translation">${t("practice.translateToFrench")}</span>${esc(q.translation)}`;
          }
          return esc(q.prompt).replace("______", `<span class="blank"><span class="visually-hidden">${t("practice.blank")}</span></span>`);
      }

      /* ---------- Phase handling ---------- */
      // Phases: prestart | unavailable | starting | start-error | answering | reviewing | result.
      function setPhase(next, { focus = true } = {}) {
          phase = next;
          $$("[data-phase]").forEach((el) => { el.hidden = el.dataset.phase !== next; });
          const inSession = next === "answering" || next === "reviewing";
          $("[data-progress-block]").hidden = !inSession;
          $("[data-stepper-nav]").hidden = next !== "answering";
          const description = $("[data-practice-description]");
          description.textContent = t(inSession ? "practice.sessionIntro" : "practice.mixedIntro");
          description.hidden = next === "result";
          if (next === "reviewing") renderReview();
          if (next === "result") renderResult();
          if (next === "answering") renderQuestion();
          updateChrome();
          if (focus) {
              window.scrollTo({ top: 0 });
              const heading = $(`[data-phase="${next}"] [tabindex="-1"]`);
              if (heading) heading.focus({ preventScroll: true });
          }
      }

      /* ---------- Start (prototype: a short fake "generating" delay, then the sample session) ---------- */
      function resetSession() { answers = {}; touched = {}; current = 0; }
      function startSession() {
          window.clearTimeout(startTimer);
          setPhase("starting", { focus: false });
          startTimer = window.setTimeout(() => {
              resetSession();
              setPhase("answering");
          }, 700);
      }
      $$("[data-action='start']").forEach((button) => button.addEventListener("click", startSession));

      /* ---------- Progress and stepper (both follow the real question count) ---------- */
      function updateChrome() {
          const count = answeredCount();
          $("[data-answered-text]").textContent = t("practice.answeredCount", { answered: count, total, n: total });
          const bar = $("[data-progressbar]");
          bar.setAttribute("aria-valuemax", String(total));
          bar.setAttribute("aria-valuenow", String(count));
          bar.style.setProperty("--progress", `${(count / total) * 100}%`);

          $("[data-stepper]").innerHTML = QUESTIONS.map((_, i) => {
              const answered = isAnswered(i);
              const isCurrent = i === current;
              return `<li><button class="step${answered ? " is-answered" : ""}" type="button" data-step="${i}"${isCurrent ? ' aria-current="step"' : ""}>
                  <span aria-hidden="true">${i + 1}</span>${answered ? '<span class="material-symbols-outlined" aria-hidden="true">check</span>' : ""}
                  <span class="visually-hidden">${t("practice.stepLabel", { n: i + 1, state: t(answered ? "practice.answeredState" : "practice.unansweredState") })}</span></button></li>`;
          }).join("");

          if (phase !== "answering") return;
          const status = $("[data-answer-status]");
          const done = isAnswered(current);
          status.innerHTML = done
              ? `<span class="material-symbols-outlined icon-filled" aria-hidden="true">check_circle</span>${t("practice.answeredThis")}`
              : `<span class="material-symbols-outlined" aria-hidden="true">radio_button_unchecked</span>${t("practice.unansweredThis")}`;

          // The last question's button is just a second entry to the same transition as "Hoàn thành bài".
          const isLast = current === total - 1;
          $("[data-action='previous']").disabled = current === 0;
          $("[data-next-label]").textContent = t(isLast ? "practice.reviewAnswers" : "practice.next");
      }

      /* ---------- Answering: question markup by type ---------- */
      function renderQuestion() {
          const q = QUESTIONS[current];
          $("[data-question-heading]").textContent = t("practice.questionOf", { n: current + 1, total });
          $("[data-question-type]").textContent = typeLabel(q.type);
          $("[data-question-instruction]").textContent = t(INSTRUCTION_KEY[q.type]);
          const body = $("[data-question-body]");
          const prompt = `<p class="question-prompt" id="prompt" lang="fr">${promptHtml(q)}</p>`;
          let html = "";

          if (q.type === "mcq") {
              // Native radios in a fieldset: arrow keys move the selection, Space selects.
              html = `<fieldset class="option-list" aria-describedby="prompt">
                  <legend class="visually-hidden">${t("practice.optionsLegend", { n: current + 1 })}</legend>
                  ${q.options.map((opt, k) => `<label class="option">
                      <input type="radio" name="q${current}" value="${esc(opt)}"${answers[current] === opt ? " checked" : ""}>
                      <span class="option-box">
                          <span class="option-letter" aria-hidden="true">${String.fromCharCode(65 + k)}</span>
                          <span class="option-text" lang="fr">${esc(opt)}</span>
                          <span class="option-check" aria-hidden="true"><span class="material-symbols-outlined">check</span></span>
                      </span></label>`).join("")}
              </fieldset>`;
          } else if (q.type === "fill_blank") {
              const value = answers[current] || "";
              const showError = touched[current] && value.trim() === "";
              html = `<div>
                  <label class="field-label" for="fill-input">${t("practice.yourAnswerLabel")}</label>
                  <input class="text-input" id="fill-input" type="text" lang="fr" autocomplete="off" autocapitalize="off" spellcheck="false"
                      placeholder="${t("practice.typeInFrench")}" value="${esc(value)}" aria-describedby="prompt fill-error"${showError ? ' aria-invalid="true"' : ""}>
                  <p class="field-error" id="fill-error"${showError ? "" : " hidden"}><span class="material-symbols-outlined" aria-hidden="true">error</span>${t("practice.fillEmptyError")}</p>
                  <div class="char-helper" role="group" aria-label="${t("practice.frenchChars")}">
                      <p class="char-helper-label">${t("practice.frenchChars")}</p>
                      <div class="char-list">${FRENCH_CHARS.map((c) => `<button class="char-button" type="button" data-char="${c}" lang="fr" aria-label="${t("practice.insertChar", { char: c })}">${c}</button>`).join("")}</div>
                  </div>
              </div>`;
          } else {
              html = `<div data-ordering></div>`;
          }
          body.innerHTML = prompt + `<div class="answer-area">${html}</div>`;
          if (q.type === "ordering") renderOrdering();
      }

      // Ordering: tap a word to place it, tap a placed word to return it. Buttons, not drag-and-drop.
      function renderOrdering(focusPiece = null) {
          const q = QUESTIONS[current];
          const placed = answers[current] || [];
          const pool = q.pieces.map((_, p) => p).filter((p) => !placed.includes(p));
          $("[data-ordering]").innerHTML = `
              <div class="ordering-heading">
                  <h3 class="ordering-title" id="slots-title">${t("practice.orderYourSentence")}</h3>
                  <button class="button button-secondary button-compact" type="button" data-reset-order${placed.length ? "" : " disabled"}>
                      <span class="material-symbols-outlined" aria-hidden="true">refresh</span><span>${t("practice.orderReset")}</span></button>
              </div>
              <ol class="ordering-slots" aria-labelledby="slots-title" lang="fr">
                  ${placed.length ? placed.map((p, pos) => `<li><button class="chip chip-placed" type="button" data-piece="${p}" data-action-order="remove">
                      <span class="chip-order" aria-hidden="true">${pos + 1}</span><span>${esc(q.pieces[p])}</span>
                      <span class="material-symbols-outlined" aria-hidden="true">close</span>
                      <span class="visually-hidden">${t("practice.orderPosition", { n: pos + 1 })}</span></button></li>`).join("")
                  : `<li class="ordering-empty" lang="${langAttr()}">${t("practice.orderEmpty")}</li>`}
              </ol>
              <h3 class="ordering-title ordering-title-pool" id="pool-title">${t("practice.orderPool")}</h3>
              <ul class="ordering-pool" aria-labelledby="pool-title" lang="fr">
                  ${pool.length ? pool.map((p) => `<li><button class="chip" type="button" data-piece="${p}" data-action-order="add">
                      <span>${esc(q.pieces[p])}</span><span class="visually-hidden">${t("practice.orderAdd")}</span></button></li>`).join("")
                  : `<li class="ordering-empty" lang="${langAttr()}">${t("practice.orderUsedAll")}</li>`}
              </ul>
              <p class="visually-hidden" role="status">${placed.length ? t("practice.orderCurrent", { sentence: esc(answerText(current)) }) : t("practice.orderNone")}</p>`;
          if (focusPiece !== null) {
              const el = $(`[data-ordering] [data-piece="${focusPiece}"]`);
              if (el) el.focus();
          }
      }

      /* ---------- Answering events (delegated) ---------- */
      const questionCard = $(".question-card");
      questionCard.addEventListener("change", (event) => {
          if (event.target.matches('input[type="radio"]')) {
              answers[current] = event.target.value;
              updateChrome();
          }
      });
      questionCard.addEventListener("input", (event) => {
          if (event.target.id === "fill-input") {
              answers[current] = event.target.value;
              touched[current] = true;
              event.target.removeAttribute("aria-invalid");
              $("#fill-error").hidden = true;
              updateChrome();
          }
      });
      questionCard.addEventListener("focusout", (event) => {
          if (event.target.id === "fill-input" && touched[current] && event.target.value.trim() === "") {
              event.target.setAttribute("aria-invalid", "true");
              $("#fill-error").hidden = false;
          }
      });
      questionCard.addEventListener("click", (event) => {
          const charButton = event.target.closest("[data-char]");
          if (charButton) {
              const input = $("#fill-input");
              const start = input.selectionStart ?? input.value.length;
              const end = input.selectionEnd ?? input.value.length;
              input.value = input.value.slice(0, start) + charButton.dataset.char + input.value.slice(end);
              input.focus();
              input.setSelectionRange(start + 1, start + 1);
              input.dispatchEvent(new Event("input", { bubbles: true }));
              return;
          }
          const chip = event.target.closest("[data-action-order]");
          if (chip) {
              const piece = Number(chip.dataset.piece);
              const placed = answers[current] || [];
              answers[current] = chip.dataset.actionOrder === "add" ? [...placed, piece] : placed.filter((p) => p !== piece);
              renderOrdering(piece);
              updateChrome();
              return;
          }
          if (event.target.closest("[data-reset-order]")) {
              answers[current] = [];
              renderOrdering();
              updateChrome();
              $("[data-ordering] .chip")?.focus();
          }
      });

      function goToQuestion(index) {
          current = index;
          renderQuestion();
          updateChrome();
          $("[data-question-heading]").focus({ preventScroll: true });
      }
      $("[data-stepper]").addEventListener("click", (event) => {
          const step = event.target.closest("[data-step]");
          if (step) goToQuestion(Number(step.dataset.step));
      });
      $("[data-action='previous']").addEventListener("click", () => {
          if (current > 0) goToQuestion(current - 1);
      });
      $("[data-action='next']").addEventListener("click", () => {
          if (current < total - 1) { goToQuestion(current + 1); return; }
          finishAnswering();
      });

      // Single prototype-only transition: answering -> reviewing, from any question, with or without
      // unanswered questions. It is NOT the final submission (that happens from the Review phase).
      function finishAnswering() { setPhase("reviewing"); }
      $("[data-action='finish']").addEventListener("click", finishAnswering);

      /* ---------- Reviewing (neutral: no correctness, no correct answers) ---------- */
      function renderReview() {
          $("[data-review-list]").innerHTML = QUESTIONS.map((q, i) => {
              const answered = isAnswered(i);
              const promptText = q.type === "ordering" ? q.translation : q.prompt;
              return `<li class="review-row${answered ? "" : " is-missing"}">
                  <div class="review-row-main">
                      <span class="review-number">${i + 1}</span>
                      <div class="review-details">
                          <p class="review-type">${t("practice.reviewTypeLine", { n: i + 1, type: typeLabel(q.type) })}</p>
                          <p class="review-prompt" lang="${q.type === "ordering" ? "vi" : "fr"}">${esc(promptText)}</p>
                          ${answered
                      ? `<p class="review-answer"><span class="material-symbols-outlined icon-filled" aria-hidden="true">check_circle</span>${t("practice.reviewYourAnswer")}<strong lang="fr">${esc(answerText(i))}</strong></p>`
                      : `<p class="review-answer is-missing"><span class="material-symbols-outlined" aria-hidden="true">radio_button_unchecked</span>${t("practice.reviewMissing")}</p>`}
                      </div>
                  </div>
                  <button class="button button-secondary button-compact" type="button" data-edit="${i}">
                      <span>${t(answered ? "practice.edit" : "practice.answerAction")}</span><span class="visually-hidden">${t("practice.reviewActionContext", { n: i + 1 })}</span></button>
              </li>`;
          }).join("");
          // Final submit stays blocked until every question is answered (prototype-only guard).
          const missing = QUESTIONS.map((_, i) => i).filter((i) => !isAnswered(i));
          const incomplete = missing.length > 0;
          $("[data-submit-main]").disabled = incomplete;
          $("[data-submit-hint]").hidden = !incomplete;
          $("[data-review-incomplete]").hidden = !incomplete;
          if (incomplete) {
              $("[data-incomplete-text]").textContent = t("practice.unansweredCount", { n: missing.length });
              $("[data-missing-label]").textContent = t("practice.answerQuestion", { n: missing[0] + 1 });
          }
      }
      $("[data-action='answer-missing']").addEventListener("click", () => {
          const first = QUESTIONS.findIndex((_, i) => !isAnswered(i));
          if (first === -1) return;
          current = first;
          setPhase("answering");
      });
      $("[data-review-list]").addEventListener("click", (event) => {
          const edit = event.target.closest("[data-edit]");
          if (!edit) return;
          current = Number(edit.dataset.edit);
          setPhase("answering");
      });
      $("[data-action='continue-editing']").addEventListener("click", () => setPhase("answering"));

      // Prototype only: a short fake "submitting" delay, then the sample result. No request is made.
      function submit() {
          if (answeredCount() !== total) return;
          const main = $("[data-submit-main]");
          $("[data-submit-error]").hidden = true;
          main.disabled = true;
          main.setAttribute("aria-busy", "true");
          $("[data-submit-label]").textContent = t("practice.submitting");
          window.setTimeout(() => {
              main.removeAttribute("aria-busy");
              $("[data-submit-label]").textContent = t("practice.submit");
              setPhase("result");
          }, 600);
      }
      $$("[data-action='submit']").forEach((button) => button.addEventListener("click", submit));

      /* ---------- Result (renders the sample Submit response as-is) ---------- */
      function renderCovered(units) {
          // Content Covered is distinct per learning unit (slug), grouped by unit_type. Empty groups are omitted.
          const seen = new Set();
          const distinct = units.filter((u) => !seen.has(u.slug) && seen.add(u.slug));
          const groupsHtml = UNIT_GROUPS.map((group) => {
              const items = distinct.filter((u) => u.unit_type === group.type);
              if (!items.length) return "";
              return `<div class="covered-group ${group.cls}">
                  <h3 class="covered-group-title"><span class="material-symbols-outlined" aria-hidden="true">${group.icon}</span>${t(group.labelKey)}</h3>
                  <ul class="covered-items">${items.map((u) => `<li>
                      <a class="covered-link" href="#" data-route="${group.route(u.slug)}">
                          <span class="covered-link-text">
                              <span class="covered-title-fr" lang="fr">${esc(u.title_fr)}</span>
                              <span class="covered-title-local">${esc(u.title)}</span>
                          </span>
                          <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                      </a></li>`).join("")}</ul>
              </div>`;
          }).join("");
          // No unit to show (empty content_covered, or only unit types this page does not group): say so
          // instead of leaving the card blank.
          $("[data-covered-groups]").innerHTML = groupsHtml
              || `<p class="card-subtitle">${t("practice.noCovered")}</p>`;
      }

      function renderResult() {
          const r = SAMPLE_RESULT;
          $("[data-result-count]").textContent = `${r.correct_count}/${r.total_questions}`;
          $("[data-result-accuracy]").textContent = `${r.accuracy}%`;
          const bar = $("[data-result-bar]");
          bar.setAttribute("aria-valuenow", String(r.accuracy));
          bar.style.setProperty("--progress", `${r.accuracy}%`);
          renderCovered(r.content_covered);
          $("[data-result-list]").innerHTML = r.questions.map((item, i) => {
              const q = QUESTIONS[i];
              const ok = item.is_correct;
              const promptText = q.type === "ordering" ? q.translation : q.prompt;
              return `<li class="result-item ${ok ? "is-correct" : "is-incorrect"}">
                  <div class="result-item-header">
                      <div>
                          <h3 class="question-number">${t("practice.questionNumber", { n: i + 1 })}</h3>
                          <p class="review-type">${typeLabel(q.type)}</p>
                      </div>
                      <span class="result-status">
                          <span class="material-symbols-outlined icon-filled" aria-hidden="true">${ok ? "check_circle" : "cancel"}</span>
                          ${t(ok ? "practice.resultCorrect" : "practice.resultIncorrect")}</span>
                  </div>
                  <p class="result-prompt" lang="${q.type === "ordering" ? "vi" : "fr"}">${esc(promptText)}</p>
                  <dl class="answer-facts">
                      <div class="answer-fact"><dt>${t("practice.yourAnswerLabel")}</dt><dd lang="fr">${esc(item.learner_answer)}</dd></div>
                      <div class="answer-fact"><dt>${t("practice.correctAnswer")}</dt><dd lang="fr">${esc(item.correct_answer)}</dd></div>
                  </dl>
                  <p class="state-note explanation"><span class="material-symbols-outlined" aria-hidden="true">lightbulb</span>
                      <span><strong>${t("practice.explanation")}</strong> ${esc(item.explanation)}</span></p>
              </li>`;
          }).join("");
      }
      // "Luyện tập lại" starts a NEW Mixed Practice session (new random selection on the backend).
      $("[data-action='practice-again']").addEventListener("click", startSession);

      /* ---------- Prototype-only: keep href="#" placeholders from jumping the page ---------- */
      document.addEventListener("click", (event) => {
          const link = event.target.closest('a[href="#"]');
          if (link) event.preventDefault();
      });

      /* ---------- Compact navigation menu (FD §8.5) ---------- */
      const menuButton = $(".menu-button");
      const mobileNav = $("#mobile-nav");
      const menuIcon = $(".material-symbols-outlined", menuButton);

      function setMenu(open) {
          menuButton.setAttribute("aria-expanded", String(open));
          menuButton.setAttribute("aria-label", t(open ? "common.menuNavClose" : "common.menuNav"));
          menuIcon.textContent = open ? "close" : "menu";
          mobileNav.hidden = !open;
      }
      menuButton.addEventListener("click", () => setMenu(mobileNav.hidden));
      mobileNav.addEventListener("click", (event) => { if (event.target.closest("a")) setMenu(false); });
      document.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && !mobileNav.hidden) { setMenu(false); menuButton.focus(); }
      });
      window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => { if (event.matches) setMenu(false); });

      /* ---------- Initial preview state ---------- */
      if (preview === "answering-partial") answers = { 0: "parle", 1: "habitons", 2: [1, 4] };
      if (["reviewing", "submit-error", "result"].includes(preview)) answers = { ...DEMO_ANSWERS };
      if (preview === "reviewing-incomplete") {
          answers = { ...DEMO_ANSWERS };
          delete answers[3];
          delete answers[5];
      }

      const INITIAL_PHASE = {
          unavailable: "unavailable",
          starting: "starting",
          "start-error": "start-error",
          answering: "answering",
          "answering-partial": "answering",
          reviewing: "reviewing",
          "reviewing-incomplete": "reviewing",
          "submit-error": "reviewing",
          result: "result",
      };
      setPhase(INITIAL_PHASE[preview] || "prestart", { focus: false });
      if (preview === "submit-error") $("[data-submit-error]").hidden = false;
      // Language change: re-render the copy this script writes, for the current phase, keeping answers.
      onLanguageChange(() => {
          setMenu(!mobileNav.hidden);
          const inSession = phase === "answering" || phase === "reviewing";
          $("[data-practice-description]").textContent = t(inSession ? "practice.sessionIntro" : "practice.mixedIntro");
          if (phase === "answering") renderQuestion();
          if (phase === "reviewing") renderReview();
          if (phase === "result") renderResult();
          updateChrome();
          $("[data-submit-label]").textContent = t($("[data-submit-main]").hasAttribute("aria-busy") ? "practice.submitting" : "practice.submit");
      });
  })();

}
