// Behavior carried over from the raw UI prototype (practice-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by PracticePage.jsx.
export default function init() {
  // UI preview only. No fetching, scoring, authentication or routing is added here.
  // Production: usePractice() owns questions / answers / phase / result (FD §5.6, §5.8).
  (() => {
      const preview = new URLSearchParams(window.location.search).get("preview");
      const $ = (selector, root = document) => root.querySelector(selector);
      const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
      const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

      /* ---------- Fixed copy (production: i18n dictionaries) ---------- */
      const TYPE_LABEL = { mcq: "Trắc nghiệm", fill_blank: "Điền vào chỗ trống", ordering: "Sắp xếp câu" };
      const INSTRUCTION = {
          mcq: "Chọn một đáp án.",
          fill_blank: "Nhập dạng đúng bằng tiếng Pháp.",
          ordering: "Nhấn vào các từ để xếp thành câu hoàn chỉnh.",
      };
      const FRENCH_CHARS = ["é", "è", "ê", "à", "â", "ç", "î", "ô", "œ"];

      /* ---------- Sample Practice Start response (question_type: mcq | fill_blank | ordering).
           No correct answers are present here, as in the real Start response. ---------- */
      const QUESTIONS = [
          { type: "mcq", prompt: "Je ______ français avec mes amis tous les jours.", options: ["parle", "parles", "parlons", "parlent"] },
          { type: "fill_blank", prompt: "Nous ______ (habiter) à Paris depuis deux ans." },
          { type: "mcq", prompt: "Vous ______ le dîner à quelle heure ? (manger)", options: ["mangez", "manges", "mangent", "mangeons"] },
          { type: "fill_blank", prompt: "Ils ______ un film français ce soir. (regarder)" },
          { type: "ordering", translation: "Tôi thích học tiếng Pháp.", pieces: ["le", "J'", "français", "apprendre", "aime"] },
          { type: "mcq", prompt: "Tu ______ de la musique classique ? (écouter)", options: ["écoute", "écoutes", "écoutez", "écoutons"] },
      ];

      /* ---------- Sample Submit response, rendered as-is. The prototype never scores answers (FD §3.3). ---------- */
      const SAMPLE_RESULT = {
          correct_count: 4,
          total_questions: 6,
          accuracy: 67,
          questions: [
              { is_correct: true, learner_answer: "parle", correct_answer: "parle", explanation: "Với je, động từ đuôi -ER bỏ -er và thêm -e: je parle." },
              { is_correct: true, learner_answer: "habitons", correct_answer: "habitons", explanation: "Với nous, thêm -ons vào gốc động từ: nous habitons." },
              { is_correct: true, learner_answer: "mangez", correct_answer: "mangez", explanation: "Với vous, thêm -ez: vous mangez." },
              { is_correct: false, learner_answer: "regarde", correct_answer: "regardent", explanation: "Ils là ngôi thứ ba số nhiều nên thêm -ent: ils regardent." },
              { is_correct: true, learner_answer: "J'aime apprendre le français", correct_answer: "J'aime apprendre le français", explanation: "Chủ ngữ J' đứng đầu, sau đó là động từ aimer và động từ nguyên mẫu apprendre." },
              { is_correct: false, learner_answer: "écoute", correct_answer: "écoutes", explanation: "Với tu, thêm -es: tu écoutes." },
          ],
      };

      /* ---------- Temporary Practice state (never persisted, FD §5.8) ---------- */
      // answers[i]: mcq -> option text; fill_blank -> string; ordering -> array of placed piece indexes.
      let answers = {};
      let current = 0;
      let phase = "answering";
      let touched = {};
      const total = QUESTIONS.length;

      const DEMO_ANSWERS = {
          0: "parle", 1: "habitons", 2: "mangez", 3: "regarde",
          4: [1, 4, 3, 0, 2], // J' aime apprendre le français
          5: "écoute",
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
              return `<span class="prompt-translation">Dịch sang tiếng Pháp</span>${esc(q.translation)}`;
          }
          return esc(q.prompt).replace("______", '<span class="blank"><span class="visually-hidden">chỗ trống</span></span>');
      }

      /* ---------- Phase handling ---------- */
      function setPhase(next, { focus = true } = {}) {
          phase = next;
          $$("[data-phase]").forEach((el) => { el.hidden = el.dataset.phase !== next; });
          $("[data-progress-block]").hidden = next === "result";
          $("[data-stepper-nav]").hidden = next !== "answering";
          $("[data-practice-description]").hidden = next === "result";
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

      /* ---------- Progress and stepper ---------- */
      function updateChrome() {
          const count = answeredCount();
          $("[data-answered-text]").textContent = `${count}/${total} câu`;
          const bar = $("[data-progressbar]");
          bar.setAttribute("aria-valuemax", String(total));
          bar.setAttribute("aria-valuenow", String(count));
          bar.style.setProperty("--progress", `${(count / total) * 100}%`);

          $("[data-stepper]").innerHTML = QUESTIONS.map((_, i) => {
              const answered = isAnswered(i);
              const isCurrent = i === current;
              return `<li><button class="step${answered ? " is-answered" : ""}" type="button" data-step="${i}"${isCurrent ? ' aria-current="step"' : ""}>
                  <span aria-hidden="true">${i + 1}</span>${answered ? '<span class="material-symbols-outlined" aria-hidden="true">check</span>' : ""}
                  <span class="visually-hidden">Câu ${i + 1}, ${answered ? "đã trả lời" : "chưa trả lời"}</span></button></li>`;
          }).join("");

          if (phase !== "answering") return;
          const status = $("[data-answer-status]");
          const done = isAnswered(current);
          status.innerHTML = done
              ? '<span class="material-symbols-outlined icon-filled" aria-hidden="true">check_circle</span>Đã trả lời câu này'
              : '<span class="material-symbols-outlined" aria-hidden="true">radio_button_unchecked</span>Chưa trả lời câu này';

          // The last question's button is just a second entry to the same transition as "Hoàn thành bài".
          const isLast = current === total - 1;
          $("[data-action='previous']").disabled = current === 0;
          $("[data-next-label]").textContent = isLast ? "Xem lại câu trả lời" : "Câu tiếp theo";
      }

      /* ---------- Answering: question markup by type ---------- */
      function renderQuestion() {
          const q = QUESTIONS[current];
          $("[data-question-heading]").textContent = `Câu ${current + 1}/${total}`;
          $("[data-question-type]").textContent = TYPE_LABEL[q.type];
          $("[data-question-instruction]").textContent = INSTRUCTION[q.type];
          const body = $("[data-question-body]");
          const prompt = `<p class="question-prompt" id="prompt" lang="fr">${promptHtml(q)}</p>`;
          let html = "";

          if (q.type === "mcq") {
              // Native radios in a fieldset: arrow keys move the selection, Space selects.
              html = `<fieldset class="option-list" aria-describedby="prompt">
                  <legend class="visually-hidden">Đáp án câu ${current + 1}</legend>
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
                  <label class="field-label" for="fill-input">Câu trả lời của bạn</label>
                  <input class="text-input" id="fill-input" type="text" lang="fr" autocomplete="off" autocapitalize="off" spellcheck="false"
                      placeholder="Nhập bằng tiếng Pháp" value="${esc(value)}" aria-describedby="prompt fill-error"${showError ? ' aria-invalid="true"' : ""}>
                  <p class="field-error" id="fill-error"${showError ? "" : " hidden"}><span class="material-symbols-outlined" aria-hidden="true">error</span>Chưa nhập câu trả lời.</p>
                  <div class="char-helper" role="group" aria-label="Ký tự tiếng Pháp">
                      <p class="char-helper-label">Ký tự tiếng Pháp</p>
                      <div class="char-list">${FRENCH_CHARS.map((c) => `<button class="char-button" type="button" data-char="${c}" lang="fr" aria-label="Chèn ký tự ${c}">${c}</button>`).join("")}</div>
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
                  <h3 class="ordering-title" id="slots-title">Câu của bạn</h3>
                  <button class="button button-secondary button-compact" type="button" data-reset-order${placed.length ? "" : " disabled"}>
                      <span class="material-symbols-outlined" aria-hidden="true">refresh</span><span>Đặt lại</span></button>
              </div>
              <ol class="ordering-slots" aria-labelledby="slots-title" lang="fr">
                  ${placed.length ? placed.map((p, pos) => `<li><button class="chip chip-placed" type="button" data-piece="${p}" data-action-order="remove">
                      <span class="chip-order" aria-hidden="true">${pos + 1}</span><span>${esc(q.pieces[p])}</span>
                      <span class="material-symbols-outlined" aria-hidden="true">close</span>
                      <span class="visually-hidden">, vị trí ${pos + 1}. Nhấn để bỏ khỏi câu</span></button></li>`).join("")
                  : '<li class="ordering-empty" lang="vi">Nhấn vào các từ bên dưới để xếp thành câu.</li>'}
              </ol>
              <h3 class="ordering-title ordering-title-pool" id="pool-title">Các từ có sẵn</h3>
              <ul class="ordering-pool" aria-labelledby="pool-title" lang="fr">
                  ${pool.length ? pool.map((p) => `<li><button class="chip" type="button" data-piece="${p}" data-action-order="add">
                      <span>${esc(q.pieces[p])}</span><span class="visually-hidden">. Nhấn để thêm vào câu</span></button></li>`).join("")
                  : '<li class="ordering-empty" lang="vi">Bạn đã dùng hết các từ.</li>'}
              </ul>
              <p class="visually-hidden" role="status">${placed.length ? `Câu hiện tại: ${esc(answerText(current))}` : "Chưa chọn từ nào"}</p>`;
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

      $("[data-stepper]").addEventListener("click", (event) => {
          const step = event.target.closest("[data-step]");
          if (!step) return;
          current = Number(step.dataset.step);
          renderQuestion();
          updateChrome();
          $("[data-question-heading]").focus({ preventScroll: true });
      });
      $("[data-action='previous']").addEventListener("click", () => {
          if (current > 0) { current -= 1; renderQuestion(); updateChrome(); $("[data-question-heading]").focus({ preventScroll: true }); }
      });
      $("[data-action='next']").addEventListener("click", () => {
          if (current < total - 1) { current += 1; renderQuestion(); updateChrome(); $("[data-question-heading]").focus({ preventScroll: true }); return; }
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
                          <p class="review-type">Câu ${i + 1} · ${TYPE_LABEL[q.type]}</p>
                          <p class="review-prompt" lang="${q.type === "ordering" ? "vi" : "fr"}">${esc(promptText)}</p>
                          ${answered
                      ? `<p class="review-answer"><span class="material-symbols-outlined icon-filled" aria-hidden="true">check_circle</span>Câu trả lời của bạn: <strong lang="fr">${esc(answerText(i))}</strong></p>`
                      : '<p class="review-answer is-missing"><span class="material-symbols-outlined" aria-hidden="true">radio_button_unchecked</span>Chưa trả lời</p>'}
                      </div>
                  </div>
                  <button class="button button-secondary button-compact" type="button" data-edit="${i}">
                      <span>${answered ? "Sửa" : "Trả lời"}</span><span class="visually-hidden"> câu ${i + 1}</span></button>
              </li>`;
          }).join("");
          // Final submit stays blocked until every question is answered (prototype-only guard).
          const missing = QUESTIONS.map((_, i) => i).filter((i) => !isAnswered(i));
          const incomplete = missing.length > 0;
          $("[data-submit-main]").disabled = incomplete;
          $("[data-submit-hint]").hidden = !incomplete;
          $("[data-review-incomplete]").hidden = !incomplete;
          if (incomplete) {
              $("[data-incomplete-text]").textContent = `Còn ${missing.length} câu chưa trả lời`;
              $("[data-missing-label]").textContent = `Trả lời câu ${missing[0] + 1}`;
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
          $("[data-submit-label]").textContent = "Đang nộp bài…";
          window.setTimeout(() => {
              main.removeAttribute("aria-busy");
              $("[data-submit-label]").textContent = "Nộp bài luyện tập";
              setPhase("result");
          }, 600);
      }
      $$("[data-action='submit']").forEach((button) => button.addEventListener("click", submit));

      /* ---------- Result (renders the sample Submit response as-is) ---------- */
      function renderResult() {
          const r = SAMPLE_RESULT;
          $("[data-result-count]").textContent = `${r.correct_count}/${r.total_questions}`;
          $("[data-result-accuracy]").textContent = `${r.accuracy}%`;
          const bar = $("[data-result-bar]");
          bar.setAttribute("aria-valuenow", String(r.accuracy));
          bar.style.setProperty("--progress", `${r.accuracy}%`);
          $("[data-result-list]").innerHTML = r.questions.map((item, i) => {
              const q = QUESTIONS[i];
              const ok = item.is_correct;
              const promptText = q.type === "ordering" ? q.translation : q.prompt;
              return `<li class="result-item ${ok ? "is-correct" : "is-incorrect"}">
                  <div class="result-item-header">
                      <div>
                          <h3 class="question-number">Câu ${i + 1}</h3>
                          <p class="review-type">${TYPE_LABEL[q.type]}</p>
                      </div>
                      <span class="result-status">
                          <span class="material-symbols-outlined icon-filled" aria-hidden="true">${ok ? "check_circle" : "cancel"}</span>
                          ${ok ? "Đúng" : "Chưa đúng"}</span>
                  </div>
                  <p class="result-prompt" lang="${q.type === "ordering" ? "vi" : "fr"}">${esc(promptText)}</p>
                  <dl class="answer-facts">
                      <div class="answer-fact"><dt>Câu trả lời của bạn</dt><dd lang="fr">${esc(item.learner_answer)}</dd></div>
                      <div class="answer-fact"><dt>Đáp án đúng</dt><dd lang="fr">${esc(item.correct_answer)}</dd></div>
                  </dl>
                  <p class="state-note explanation"><span class="material-symbols-outlined" aria-hidden="true">lightbulb</span>
                      <span><strong>Giải thích:</strong> ${esc(item.explanation)}</span></p>
              </li>`;
          }).join("");
      }
      $("[data-action='practice-again']").addEventListener("click", () => {
          // Production: startNormalPractice(slug) creates a NEW practice run (Requirements §8.3).
          answers = {}; touched = {}; current = 0;
          setPhase("answering");
      });

      /* ---------- Page states ---------- */
      const pageStates = $$("[data-page-state]");
      function showPageState(name) {
          pageStates.forEach((el) => { el.hidden = el.dataset.pageState !== name; });
          $("[data-practice-content]").hidden = name !== "content";
          $("[data-practice-header]").hidden = name === "loading" || name === "error";
      }
      $("[data-action='retry-page']").addEventListener("click", () => showPageState("content"));

      /* ---------- Compact navigation menu (FD §8.5) ---------- */
      const menuButton = $(".menu-button");
      const mobileNav = $("#mobile-nav");
      const menuIcon = $(".material-symbols-outlined", menuButton);
      function setMenu(open) {
          menuButton.setAttribute("aria-expanded", String(open));
          menuButton.setAttribute("aria-label", open ? "Đóng menu điều hướng" : "Menu điều hướng");
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
      if (preview === "answering-partial") answers = { 0: "parle", 1: "habitons", 4: [1, 4] };
      if (["reviewing", "submit-error", "result"].includes(preview)) answers = { ...DEMO_ANSWERS };
      if (preview === "reviewing-incomplete") answers = { ...DEMO_ANSWERS, 3: "", 5: undefined };

      if (preview === "reviewing" || preview === "reviewing-incomplete" || preview === "submit-error") setPhase("reviewing", { focus: false });
      else if (preview === "result") setPhase("result", { focus: false });
      else setPhase("answering", { focus: false });

      if (preview === "submit-error") $("[data-submit-error]").hidden = false;
      if (preview === "loading") showPageState("loading");
      if (preview === "error") showPageState("error");
  })();

}
