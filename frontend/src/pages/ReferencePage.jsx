/*
 Fonts and the logo still require an internet connection. -->
    <link href="https://fonts.googleapis.com" rel="preconnect">
    <link href="https://fonts.gstatic.com" crossorigin="" rel="preconnect">
    <link
        href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&amp;display=swap"
        rel="stylesheet">
    <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        rel="stylesheet">
    <link
        href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,300..800;1,6..12,300..800&amp;display=swap"
        rel="stylesheet">

    <!--
      Static ReferencePage prototype (route /basics/:referenceSlug; sample slug french-alphabet-accents).
      App shell, tokens, and shared patterns are copied from the approved Dashboard / VocabularyPage;
      breadcrumbs, Markdown typography, tables, notes, and page states follow GrammarLessonPage.
      frontend-design.md (FD) §4.2, §7.6, §8, §9. Plain CSS, no build step, no Tailwind.

      What this page is NOT: a learning unit. Reference content lives in reference_pages, not in
      learning_units, so there is no learner state anywhere on the page: no Mark as Learned, no
      Review Later, no Practice, no progress, no open-recording call, no Previous / Next lesson.
      Opening it has no side effects.

      Data:
      - Rendered from SAMPLE_REFERENCE in the script below, which has the exact shape of
        GET /api/v1/references/{slug} (API Contract §12.1):
        { slug, title_fr, title, content }. The page depends on nothing else.
      - title_fr is the primary title (lang="fr"); the localized title is the support line. When the
        API falls back to title_fr (API §4.9) the support line is omitted.
      - content is ONE localized Markdown string. Production renders it once through the shared
        Markdown renderer (FD §9.3). This prototype has no Markdown parser, so the <template>
        elements at the end hold the HTML such a renderer produces. Styling targets plain Markdown
        elements (.markdown-body h2, h3, p, ul, ol, blockquote, table, hr), never reference-specific
        classes, so any reference structure renders without layout changes (?preview=alt-content
        proves this with a different shape). Renderer mapping assumed: each <table> is wrapped in
        .table-scroll. The sample also puts lang="fr" on French letters and words; the renderer must
        support that (raw HTML is not enabled in lesson Markdown), otherwise those attributes are
        simply absent and nothing else changes.
      - The alphabet, accent, and pronunciation sections below are sample Markdown, not API fields.
        Final production content is the authored Markdown source stored in reference_pages.
      - Cards are PRESENTATION of that one Markdown string, not a schema. The renderer assumption
        (FD §9.3) is small and generic: (1) each `##` heading and the content after it is wrapped in
        <section class="card ref-section">; (2) a Markdown container directive maps a bullet list to
        <ul class="ref-cards ref-cards--{vowels|consonants|accents|rules}" role="list"> and `:::tip`
        to <div class="ref-callout">. Inside a card the author writes plain Markdown: **bold** first
        (the letter or title), *emphasis* second (IPA or accent name), then text. Accent items are loose
        list items: a header paragraph (**characters** + *name*), a tagline paragraph, a short bullet
        list, and a last paragraph starting with **Ví dụ** (one example per line).
        IPA written as /.../ is rendered as
        <span class="ref-ipa">; French terms are <em lang="fr">. If a reference uses none of the directives it renders as normal prose inside the section cards,
        and a table still scrolls locally (?preview=alt-content). No card carries an action or state.
      - Breadcrumb: Từ vựng links to /vocabulary; the reference title is the current item. No other
        route is assumed.
      - Main navigation: no new item. Vocabulary stays highlighted because the reference is reached
        from the Vocabulary area (as Grammar stays highlighted on grammar lesson pages).
      - Color by role: cream / white surfaces; gold = the reference role already used by the
        Alphabet & Accents entry on VocabularyPage (icon tile, label, h2 marker, list markers);
        blue = information (Markdown notes, links). No learned / Review Later / progress colors.

      Preview states (prototype only), via the URL query string:
        (none)                  French Alphabet & Accents
        ?preview=alt-content    a different reference and Markdown structure, no localized title
        ?preview=loading        reference request loading
        ?preview=error          reference request failed

      Page sections:
      1. Header (same component as the Dashboard, Vocabulary active)
      2. Breadcrumbs
      3. Page states: loading, error
      4. Reference header: French title, support title
      5. Reference content (Markdown) + return link
      6. Footer
*/
import styles from "./ReferencePage.module.css";
import usePageScript from "../hooks/usePageScript.js";
import init from "./ReferencePage.script.js";

export default function ReferencePage() {
  const rootRef = usePageScript(init, { title: "Français Learning Journey | Alphabet français et accents" });

  return (
    <div className={styles.page} ref={rootRef}>
      {/* 1. Header (same component as the Dashboard; Vocabulary stays active because the reference is
         reached from the Vocabulary area. No "Reference" item is added).
      */}
      <header className="site-header">
        <div className="page-container header-content">
          <div className="brand">
            <img alt="Linh vật bánh sừng bò đeo kính, tay cầm sách" className="brand-logo" src="/images/logo.png" />
            {" "}
            <span className="brand-name">
              Français Learning Journey
            </span>
          </div>
          <nav className="main-nav" aria-label="Điều hướng chính">
            <a className="nav-link" href="#" data-route="/dashboard">
              Bảng điều khiển
            </a>
            {" "}
            <a className="nav-link" href="#" data-route="/vocabulary" aria-current="page">
              Từ vựng
            </a>
            {" "}
            <a className="nav-link" href="#" data-route="/grammar">
              Ngữ pháp
            </a>
            {" "}
            <a className="nav-link" href="#" data-route="/conjugation">
              Chia động từ
            </a>
          </nav>
          <div className="header-actions">
            <div className="language-switcher" role="group" aria-label="Ngôn ngữ hỗ trợ">
              <button className="language-button" type="button" aria-pressed="true" data-lang="vi" title="Tiếng Việt">
                VI
              </button>
              {" "}
              <button className="language-button" type="button" aria-pressed="false" data-lang="en" title="English">
                EN
              </button>
            </div>
            <button className="logout-button" type="button" aria-label="Đăng xuất" title="Đăng xuất">
              <span className="material-symbols-outlined" aria-hidden="true">
                logout
              </span>
              {" "}
              <span className="logout-label">
                Đăng xuất
              </span>
            </button>
            {" "}
            <button className="menu-button" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Menu điều hướng">
              <span className="material-symbols-outlined" aria-hidden="true">
                menu
              </span>
            </button>
          </div>
        </div>
        <nav className="mobile-nav" id="mobile-nav" aria-label="Điều hướng chính" hidden>
          <div className="page-container mobile-nav-list">
            <a className="mobile-nav-link" href="#" data-route="/dashboard">
              Bảng điều khiển
            </a>
            {" "}
            <a className="mobile-nav-link" href="#" data-route="/vocabulary" aria-current="page">
              Từ vựng
            </a>
            {" "}
            <a className="mobile-nav-link" href="#" data-route="/grammar">
              Ngữ pháp
            </a>
            {" "}
            <a className="mobile-nav-link" href="#" data-route="/conjugation">
              Chia động từ
            </a>
          </div>
        </nav>
      </header>
      <main className="page-container reference-page reference-role" id="main-content">
        <div className="reference" data-reference>
          {/* 2. Breadcrumbs. Only "Từ vựng" is a link (/vocabulary). */}
          <nav className="breadcrumbs" aria-label="Đường dẫn trang">
            <ol className="breadcrumb-list">
              <li>
                <a className="crumb-link" href="#" data-route="/vocabulary">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    style
                  </span>
                  {" "}
                  <span>
                    Từ vựng
                  </span>
                </a>
              </li>
              <li className="crumb-current-item" data-crumb="current">
                <span className="material-symbols-outlined crumb-separator" aria-hidden="true">
                  chevron_right
                </span>
                {" "}
                <span className="crumb-current" aria-current="page" lang="fr" data-slot="crumb-title">
                  Alphabet français et accents
                </span>
              </li>
            </ol>
          </nav>
          {/* 3. Page states (FD §6.6). Shown instead of the reference; no sample data behind them. */}
          <div className="card page-state" data-page-state="loading" role="status" hidden>
            <div className="spinner" aria-hidden="true" />
            <p>
              Đang tải tài liệu tham khảo…
            </p>
          </div>
          <div className="card page-state" data-page-state="error" role="alert" hidden>
            <span className="material-symbols-outlined" aria-hidden="true">
              cloud_off
            </span>
            <h1 className="page-state-title">
              Không thể tải tài liệu tham khảo
            </h1>
            <p>
              Đã có lỗi khi tải dữ liệu. Vui lòng thử lại.
            </p>
            <button className="button button-secondary button-compact" type="button" data-action="retry">
              Thử lại
            </button>
          </div>
          <article aria-labelledby="reference-title" data-reference-content>
            {/* 4. Reference header: French title first, localized title second. No state, no progress. */}
            <header className="card reference-header">
              <div className="icon-tile" aria-hidden="true">
                <span className="material-symbols-outlined">
                  local_library
                </span>
              </div>
              <div className="reference-heading">
                <p className="reference-label">
                  <span className="badge">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      menu_book
                    </span>
                    {" "}
                    <span>
                      Tài liệu tham khảo
                    </span>
                  </span>
                </p>
                <h1 className="reference-title" id="reference-title" lang="fr" data-slot="title">
                  Alphabet français et accents
                </h1>
                <p className="title-support" data-slot="support">
                  Bảng chữ cái và dấu trong tiếng Pháp
                </p>
                <p className="reference-note">
                  Kiến thức nền tảng để tra cứu bất cứ lúc nào, không tính vào tiến độ học tập.
                </p>
              </div>
            </header>
            {/* 5. Reference content. The Markdown renderer outputs `content` here. */}
            <div className="markdown-body reference-body" data-slot="content" />
            {/* Contextual return only: leaves the page and changes nothing. */}
            <div className="reference-return">
              <a className="button button-secondary" href="#" data-route="/vocabulary">
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_back
                </span>
                {" "}
                <span>
                  Quay lại Từ vựng
                </span>
              </a>
            </div>
          </article>
        </div>
      </main>
      {/* 6. Footer */}
      <footer className="site-footer">
        <div className="page-container footer-content">
          <span className="material-symbols-outlined" aria-hidden="true">
            auto_stories
          </span>
          {" "}
          <span>
            Français Learning Journey • Hành trình chinh phục tiếng Pháp
          </span>
        </div>
      </footer>
      {/*      Rendered Markdown samples (prototype only). Each template is what the Markdown renderer outputs
      for one reference's `content` string: headings, paragraphs, emphasis, lists, blockquotes and
      tables (each wrapped in .table-scroll). The alphabet / accent / pronunciation sections are
      ordinary Markdown, not API fields. Production content is authored Markdown (reference_pages).
      Vietnamese "cách đọc" values are approximations for orientation; IPA is the reference.

      */}
      <template id="content-french-alphabet-accents" dangerouslySetInnerHTML={{ __html: `
        <p>Tiếng Pháp dùng bảng chữ cái Latinh gồm <strong>26 chữ cái</strong>. Hình chữ giống tiếng Anh, nhưng tên
            gọi và cách phát âm khác nhiều.</p>

        <section class="card ref-section">
            <h2>Bảng chữ cái</h2>
            <p>Cột đọc gần giống ghi bằng âm tiếng Việt để làm quen. Hãy xem ký hiệu IPA làm chuẩn.</p>

            <h3>Nguyên âm</h3>
            <ul class="ref-cards ref-cards--vowels" role="list">
                <li><strong lang="fr">A a</strong><em>/a/</em>a</li>
                <li><strong lang="fr">E e</strong><em>/ə/</em>ơ (ngắn, môi hơi tròn)</li>
                <li><strong lang="fr">I i</strong><em>/i/</em>i</li>
                <li><strong lang="fr">O o</strong><em>/o/</em>ô</li>
                <li><strong lang="fr">U u</strong><em>/y/</em>chu môi tròn rồi đọc “i”</li>
                <li><strong lang="fr">Y y</strong><em>/i.ɡʁɛk/</em>i-gờ-réc</li>
            </ul>

            <h3>Phụ âm</h3>
            <ul class="ref-cards ref-cards--consonants" role="list">
                <li><strong lang="fr">B b</strong><em>/be/</em>bê</li>
                <li><strong lang="fr">C c</strong><em>/se/</em>xê</li>
                <li><strong lang="fr">D d</strong><em>/de/</em>đê</li>
                <li><strong lang="fr">F f</strong><em>/ɛf/</em>ép-phơ</li>
                <li><strong lang="fr">G g</strong><em>/ʒe/</em>giê</li>
                <li><strong lang="fr">H h</strong><em>/aʃ/</em>át-sơ (chữ h luôn câm)</li>
                <li><strong lang="fr">J j</strong><em>/ʒi/</em>gi</li>
                <li><strong lang="fr">K k</strong><em>/ka/</em>ca</li>
                <li><strong lang="fr">L l</strong><em>/ɛl/</em>e-lơ</li>
                <li><strong lang="fr">M m</strong><em>/ɛm/</em>em-mơ</li>
                <li><strong lang="fr">N n</strong><em>/ɛn/</em>en-nơ</li>
                <li><strong lang="fr">P p</strong><em>/pe/</em>pê</li>
                <li><strong lang="fr">Q q</strong><em>/ky/</em>cu (chu môi như đọc “i”)</li>
                <li><strong lang="fr">R r</strong><em>/ɛʁ/</em>e-rơ (âm r ở cuống họng)</li>
                <li><strong lang="fr">S s</strong><em>/ɛs/</em>ét-sơ</li>
                <li><strong lang="fr">T t</strong><em>/te/</em>tê</li>
                <li><strong lang="fr">V v</strong><em>/ve/</em>vê</li>
                <li><strong lang="fr">W w</strong><em>/du.blə.ve/</em>đúp-blơ-vê</li>
                <li><strong lang="fr">X x</strong><em>/iks/</em>íc-xơ</li>
                <li><strong lang="fr">Z z</strong><em>/zɛd/</em>dét</li>
            </ul>
        </section>

        <section class="card ref-section">
            <h2>Các dấu trong tiếng Pháp</h2>
            <p>Dấu (<em lang="fr">accent</em>) đặt trên hoặc dưới chữ cái. Dấu có thể đổi cách đọc nguyên âm, tách hai
                nguyên âm liền nhau, hoặc chỉ để phân biệt hai từ đồng âm.</p>
            <blockquote>
                <p><strong>Lưu ý:</strong> dấu trong tiếng Pháp không phải thanh điệu như tiếng Việt. Dấu không đổi cao
                    độ của âm tiết, mà đổi âm của nguyên âm hoặc nghĩa của từ.</p>
            </blockquote>
            <ul class="ref-cards ref-cards--accents" role="list">
                <li>
                    <p><strong lang="fr">é</strong><em lang="fr">accent aigu</em></p>
                    <p><strong>Dấu sắc.</strong> Chỉ đặt trên chữ e.</p>
                    <ul>
                        <li>Đọc <span class="ref-ipa">/e/</span>, gần âm “ê”</li>
                    </ul>
                    <p><strong>Ví dụ</strong><br><em lang="fr">café</em> <span class="ref-ipa">/kafe/</span> — cà
                        phê<br><em lang="fr">été</em> <span class="ref-ipa">/ete/</span> — mùa hè</p>
                </li>
                <li>
                    <p><strong lang="fr">è à ù</strong><em lang="fr">accent grave</em></p>
                    <p><strong>Dấu huyền.</strong> Đổi âm ở è, chỉ để phân biệt từ ở à và ù.</p>
                    <ul>
                        <li><span lang="fr">è</span> đọc <span class="ref-ipa">/ɛ/</span>, gần âm “e” mở</li>
                        <li><span lang="fr">à</span>, <span lang="fr">ù</span> đọc như a, u</li>
                    </ul>
                    <p><strong>Ví dụ</strong><br><em lang="fr">mère</em> <span class="ref-ipa">/mɛʁ/</span> — mẹ<br><em
                            lang="fr">à</em> (tại, đến) và <em lang="fr">a</em> (có)<br><em lang="fr">où</em> (ở đâu) và
                        <em lang="fr">ou</em> (hoặc)
                    </p>
                </li>
                <li>
                    <p><strong lang="fr">â ê î ô û</strong><em lang="fr">accent circonflexe</em></p>
                    <p><strong>Dấu mũ.</strong> Thường gợi lại một chữ s cổ.</p>
                    <ul>
                        <li><span lang="fr">ê</span> đọc <span class="ref-ipa">/ɛ/</span>, <span lang="fr">ô</span> đọc
                            <span class="ref-ipa">/o/</span>, <span lang="fr">û</span> đọc <span
                                class="ref-ipa">/y/</span>
                        </li>
                        <li><span lang="fr">â</span>, <span lang="fr">î</span> gần như không đổi âm</li>
                    </ul>
                    <p><strong>Ví dụ</strong><br><em lang="fr">fête</em> <span class="ref-ipa">/fɛt/</span> — lễ
                        hội<br><em lang="fr">forêt</em> <span class="ref-ipa">/fɔ.ʁɛ/</span> — khu rừng<br><em
                            lang="fr">hôtel</em> <span class="ref-ipa">/o.tɛl/</span> — khách sạn</p>
                </li>
                <li>
                    <p><strong lang="fr">ë ï ü</strong><em lang="fr">tréma</em></p>
                    <p><strong>Dấu hai chấm.</strong> Báo hiệu đọc tách khỏi nguyên âm đứng trước.</p>
                    <ul>
                        <li><span lang="fr">ü</span> hiếm gặp: báo hiệu chữ u phải được đọc</li>
                    </ul>
                    <p><strong>Ví dụ</strong><br><em lang="fr">Noël</em> <span class="ref-ipa">/nɔ.ɛl/</span> — Giáng
                        sinh<br><em lang="fr">maïs</em> <span class="ref-ipa">/ma.is/</span> — ngô</p>
                </li>
                <li>
                    <p><strong lang="fr">ç</strong><em lang="fr">cédille</em></p>
                    <p><strong>Dấu móc dưới.</strong> Chỉ đi với chữ c.</p>
                    <ul>
                        <li>Đọc <span class="ref-ipa">/s/</span> trước a, o, u</li>
                    </ul>
                    <p><strong>Ví dụ</strong><br><em lang="fr">français</em> <span class="ref-ipa">/fʁɑ̃.sɛ/</span> —
                        tiếng Pháp<br><em lang="fr">garçon</em> <span class="ref-ipa">/ɡaʁ.sɔ̃/</span> — cậu bé<br><em
                            lang="fr">leçon</em> <span class="ref-ipa">/lə.sɔ̃/</span> — bài học</p>
                </li>
            </ul>
        </section>

        <section class="card ref-section">
            <h2>Lưu ý về phát âm và chính tả</h2>
            <ul class="ref-cards ref-cards--rules" role="list">
                <li><strong>Chữ <code>h</code> luôn câm</strong><br><em lang="fr">hôtel</em> <span
                        class="ref-ipa">/o.tɛl/</span>, <em lang="fr">homme</em> <span class="ref-ipa">/ɔm/</span></li>
                <li><strong>Phụ âm cuối thường không đọc</strong><br><em lang="fr">petit</em> <span
                        class="ref-ipa">/pə.ti/</span>, <em lang="fr">grand</em> <span class="ref-ipa">/ɡʁɑ̃/</span>
                </li>
                <li><strong>Chữ <code>c</code></strong><br>Đọc <span class="ref-ipa">/k/</span> trước a, o, u và đọc
                    <span class="ref-ipa">/s/</span> trước e, i, y.
                </li>
                <li><strong>Chữ <code>g</code></strong><br>Đọc <span class="ref-ipa">/ɡ/</span> trước a, o, u và đọc
                    <span class="ref-ipa">/ʒ/</span> trước e, i, y.
                </li>
            </ul>
            <div class="ref-callout">
                <p><strong>Mẹo nhỏ:</strong> khi viết, dấu là một phần của chữ. <em lang="fr">a</em> và <em
                        lang="fr">à</em>, <em lang="fr">ou</em> và
                    <em lang="fr">où</em> có nghĩa khác nhau, nên đừng bỏ dấu.
                </p>
            </div>
        </section>

        <section class="card ref-section">
            <h2>Đọc thử</h2>
            <ol>
                <li><em lang="fr">français</em> <span class="ref-ipa">/fʁɑ̃.sɛ/</span> — tiếng Pháp. Chữ <em
                        lang="fr">ç</em> đọc <span class="ref-ipa">/s/</span>.</li>
                <li><em lang="fr">élève</em> <span class="ref-ipa">/e.lɛv/</span> — học sinh. Phân biệt <em
                        lang="fr">é</em> <span class="ref-ipa">/e/</span> và <em lang="fr">è</em> <span
                        class="ref-ipa">/ɛ/</span>.</li>
                <li><em lang="fr">forêt</em> <span class="ref-ipa">/fɔ.ʁɛ/</span> — khu rừng. Dấu mũ trên <em
                        lang="fr">ê</em>.</li>
                <li><em lang="fr">Noël</em> <span class="ref-ipa">/nɔ.ɛl/</span> — Giáng sinh. Dấu hai chấm tách o và e.
                </li>
            </ol>
        </section>
    ` }} />
      {/* A different reference with a different Markdown shape (?preview=alt-content): layout check only. */}
      <template id="content-alt-reference" dangerouslySetInnerHTML={{ __html: `
        <section class="card ref-section">
            <p>Dùng bảng này để tra nhanh các số từ 0 đến 5. Phần giải thích ngắn đứng trước bảng.</p>
            <ol>
                <li>Nhìn số ở cột đầu tiên.</li>
                <li>Đọc từ tiếng Pháp ở cột thứ hai.</li>
            </ol>
            <div class="table-scroll" role="region" aria-label="Bảng" tabindex="0">
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Số</th>
                            <th scope="col">Tiếng Pháp</th>
                            <th scope="col">Phát âm (IPA)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>0</td>
                            <td><em lang="fr">zéro</em></td>
                            <td>/ze.ʁo/</td>
                        </tr>
                        <tr>
                            <td>1</td>
                            <td><em lang="fr">un / une</em></td>
                            <td>/œ̃/ · /yn/</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td><em lang="fr">deux</em></td>
                            <td>/dø/</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td><em lang="fr">trois</em></td>
                            <td>/tʁwa/</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <h3>Ghi chú</h3>
            <p>Số 1 đổi theo giống của danh từ đi kèm.</p>
            <blockquote>
                <p>Chỉ là mẫu kiểm tra bố cục: nội dung thật do tác giả viết bằng Markdown.</p>
            </blockquote>
        </section>
    ` }} />
    </div>
  );
}
