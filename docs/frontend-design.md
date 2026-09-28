# French Learning Web Application
## Frontend Design Specification

**Document status:** Baseline v1.0
**Project type:** Web Application Development final project  
**Frontend:** React + Vite  
**Routing:** React Router with `BrowserRouter`  
**Backend integration:** REST-style HTTP API + JSON  
**API base path:** `/api/v1`  
**Authentication:** Flask session cookie  
**Primary user role:** Learner  
**Support languages:** Vietnamese and English  
**Deployment target:** Local development and local demonstration  

---

## 1. Purpose

This document defines the frontend design for the French Learning Web Application MVP.

It translates the approved requirements, system architecture, API contract, repository conventions, and learner flows into an implementation-oriented React structure. It defines:

- route and page structure;
- public, guest-focused, and protected navigation behavior;
- shared and feature-specific component boundaries;
- frontend state ownership;
- Context and custom-hook responsibilities;
- frontend API-client organization;
- UI and wireframe direction;
- responsive behavior;
- localization and data-driven content rules;
- accessibility and interaction expectations;
- frontend implementation guardrails.

The document is intended to be used by all frontend contributors, including AI-assisted coding workflows. Implementation should follow this design unless the team explicitly approves a frontend-design change.

This document does not redefine backend business rules, API payloads, or database structure. Those remain governed by the existing Requirements & Analysis, System Architecture, API Contract, Database Design, Backend Structure, and Repository Conventions specifications.

---

## 2. Frontend Scope

The frontend supports the agreed learner-facing MVP:

- public Landing, Login, and Register pages;
- authenticated first-time support-language setup;
- Dashboard;
- Grammar browsing and lesson reading;
- Vocabulary browsing and Study Unit reading;
- Verb Conjugation browsing and lesson reading;
- French Alphabet & Accents reference content;
- Mark as Learned;
- Review Later;
- Continue Learning;
- normal Practice;
- Mixed Practice;
- Practice Result feedback;
- basic Practice History shown on the Dashboard;
- current and longest streak presentation;
- module progress presentation;
- Learning Activity Calendar on the Dashboard (a Should Have feature that has been selected for implementation; its contract is API §8.2).

The frontend intentionally does not introduce:

- a Teacher or Administrator UI;
- a content-management dashboard;
- a separate full Progress page;
- a separate full Practice History page;
- prerequisite-locking UI;
- score-based lesson unlocking;
- JWT/token storage in the browser;
- Redux, Zustand, or another global application store for the MVP;
- a client-side duplicate of backend scoring, streak, progress, or eligibility rules;
- a separate route for every database table or hierarchy level.

---

## 3. Frontend Design Principles

### 3.1 Keep route-level screens separate from reusable UI

A **Page** represents a route-level screen.

A **Component** represents a reusable UI unit inside a page or feature.

A page should primarily:

```text
load / receive page data
+ manage page-level state
+ compose smaller components
```

Large pages should not become monolithic files containing every visual element and interaction.

### 3.2 Keep state close to where it is used

State should have one clear owner.

Use:

- local component state for local UI interactions;
- page/custom-hook state for route-specific data and interactions;
- Context only for genuinely application-wide state.

Do not move state into a global store merely because it changes over time.

### 3.3 Treat the backend as authoritative

React owns presentation, navigation, temporary interaction state, and current unsaved Practice answers.

Flask remains authoritative for:

- authenticated learner identity;
- persistent learner state;
- Practice correctness and trusted score calculation;
- Mixed Practice eligibility;
- progress truth;
- streak truth;
- completion timestamps;
- ownership checks;
- persistence and business rules.

### 3.4 Prefer data-driven UI over hard-coded learning content

Curriculum content is loaded through the API.

The frontend must not hard-code specific Grammar Part, Chapter, Lesson, Vocabulary Topic, Study Unit, Conjugation Lesson, or Reference titles into route components.

The UI provides reusable containers and renderers; the API provides the current content and localized labels.

### 3.5 Keep the MVP understandable

The frontend should remain simple enough for a six-person student team to implement, integrate, explain, debug, and demonstrate.

Avoid introducing additional libraries or architectural layers unless they solve a concrete project need.

---

# 4. Route & Page Structure

## 4.1 Routing Model

The frontend uses React Router with `BrowserRouter` and declarative client-side routing.

Conceptually:

```text
Browser URL
   |
   v
React Router
   |
   v
Route-level Page
   |
   v
Feature / Shared Components
```

Stable content slugs are used in learner-facing URLs rather than internal numeric database IDs.

Examples:

```text
/grammar/lessons/articles-definis
/vocabulary/topics/alimentation
/vocabulary/study-units/alimentation-1
/conjugation/lessons/present-regular-er
```

The frontend route structure is a user-experience structure. It does not need to mirror database tables one-to-one.

---

## 4.2 Route Table

| Route | Page | Access | Purpose |
|---|---|---|---|
| `/` | `LandingPage` | Public | Public entry point |
| `/login` | `LoginPage` | Guest-focused | Learner login |
| `/register` | `RegisterPage` | Guest-focused | Learner registration |
| `/setup/language` | `LanguageSetupPage` | Authenticated, language not yet saved | First-time VI/EN selection |
| `/dashboard` | `DashboardPage` | Protected | Main authenticated home |
| `/basics/:referenceSlug` | `ReferencePage` | Protected | Reference content such as Alphabet & Accents |
| `/grammar` | `GrammarPage` | Protected | Grammar browse page |
| `/grammar/lessons/:lessonSlug` | `GrammarLessonPage` | Protected | Grammar lesson detail |
| `/vocabulary` | `VocabularyPage` | Protected | Vocabulary browse page |
| `/vocabulary/topics/:topicSlug` | `VocabularyTopicPage` | Protected | Vocabulary topic browse page |
| `/vocabulary/study-units/:unitSlug` | `VocabularyStudyUnitPage` | Protected | Vocabulary Study Unit detail |
| `/conjugation` | `ConjugationPage` | Protected | Conjugation browse page |
| `/conjugation/lessons/:lessonSlug` | `ConjugationLessonPage` | Protected | Rule/pattern lesson detail |
| `/practice/:unitSlug` | `PracticePage` | Protected | Generic normal-Practice flow |
| `/mixed-practice` | `MixedPracticePage` | Protected | Mixed Practice flow |
| `/review-later` | `ReviewLaterPage` | Protected | Saved Review Later units |
| `*` | `NotFoundPage` | Fallback | Frontend 404 state |

---

## 4.3 Route Guard Structure

The conceptual route-guard structure is:

```text
BrowserRouter
└── Routes
    ├── Public
    │   └── /
    │
    ├── Guest-focused
    │   ├── /login
    │   └── /register
    │
    └── RequireAuth
        ├── /setup/language
        │
        └── RequireLanguage
            └── AppLayout
                ├── /dashboard
                ├── /basics/...
                ├── /grammar/...
                ├── /vocabulary/...
                ├── /conjugation/...
                ├── /practice/...
                ├── /mixed-practice
                └── /review-later
```

### 4.3.1 `RequireAuth`

If no authenticated learner is available:

```text
protected route
-> redirect to /login
```

The redirect is a frontend navigation decision only. Flask still enforces authentication for protected API endpoints.

### 4.3.2 `RequireLanguage`

If the learner is authenticated but:

```text
support_language === null
```

then the learner is routed to:

```text
/setup/language
```

The language-setup route must remain inside authenticated routing but outside the language-required branch so that it does not redirect to itself.

### 4.3.3 Authenticated access to Login/Register

If an already authenticated learner enters:

```text
/login
/register
```

the frontend redirects to:

```text
/dashboard
```

If that learner still has `support_language === null`, normal language guarding then sends the learner to `/setup/language` before authenticated application content is shown.

### 4.3.4 Authentication loading state

The application must distinguish at least:

```text
checking session
authenticated
unauthenticated
```

Protected-route decisions must not be made before the initial current-user request has finished. This prevents redirect flicker while the session is being resolved.

---

## 4.4 Navigation

Authenticated main navigation remains intentionally minimal. The approved order and labels are:

| Item | EN UI | VI UI | Route |
|---|---|---|---|
| Home / Dashboard | Dashboard | Bảng điều khiển | `/dashboard` |
| Vocabulary | Vocabulary | Từ vựng | `/vocabulary` |
| Grammar | Grammar | Ngữ pháp | `/grammar` |
| Conjugation | Conjugation | Chia động từ | `/conjugation` |
| Language selector | VI / EN | VI / EN | — (preference update) |
| Logout | Log out | Đăng xuất | — (logout action) |

The "Home" destination in Requirements §14.3 is presented as **Dashboard**. The module order (Vocabulary, Grammar, Conjugation) is the same order used by the Dashboard module cards.

Use internal React Router navigation (`NavLink` or equivalent) for client-side navigation and active-route styling (`aria-current="page"` on the active item).

The following do not require permanent main-navigation items:

- Mixed Practice;
- Review Later;
- French Alphabet & Accents / reference content;
- Practice History;
- Progress.

They are reached from Dashboard, Vocabulary, or contextual learning actions.

A separate Progress page is not required because Dashboard presents module progress.

A separate Practice History page is not required because Dashboard presents Recent Practice.

---

## 4.5 Page Hierarchy Decisions

The frontend does not create a route for every intermediate curriculum hierarchy level.

### Grammar

Data hierarchy:

```text
Part
└── Chapter
    └── Lesson
```

Frontend page structure:

```text
GrammarPage
└── grouped Part / Chapter sections
    └── lesson links

GrammarLessonPage
```

Part and Chapter are grouping structures inside `GrammarPage`, not independent route-level pages.

### Vocabulary

Data hierarchy:

```text
Category
└── Topic
    └── Subtopic
        └── Study Unit
```

Frontend page structure:

```text
VocabularyPage
VocabularyTopicPage
VocabularyStudyUnitPage
```

Category and Subtopic can be rendered as sections/groups within their parent pages.

### Verb Conjugation

Data hierarchy:

```text
Tense
└── Rule / Pattern Lesson
```

Frontend page structure:

```text
ConjugationPage
└── Tense sections
    └── lesson links

ConjugationLessonPage
```

Tense does not require an independent route-level page in the MVP.

---

## 4.6 Generic Practice Route

Normal Practice uses one generic route:

```text
/practice/:unitSlug
```

It is shared by Grammar, Vocabulary, and Conjugation learning units.

Do not create three duplicated Practice route families such as:

```text
/grammar/.../practice
/vocabulary/.../practice
/conjugation/.../practice
```

The backend already starts normal Practice through a generic learning-unit endpoint, so the frontend should preserve the same reusable interaction model.

---

## 4.7 Practice Result Routing

For API v1, Practice Result is not a separately reloadable route.

The flow is:

```text
PracticePage / MixedPracticePage
        |
        v
answering
        |
        v
reviewing
        |
        v
final submit
        |
        v
PracticeResult component
```

The Submit API returns detailed result feedback immediately, but the API does not provide an independent GET endpoint for reloading detailed per-question result feedback later.

Therefore, do not create a URL such as:

```text
/practice/:slug/result
```

because such a URL would imply bookmark/reload behavior the current API cannot support.

If a future API adds persisted detailed Practice-result retrieval, a route such as `/history/:sessionId` may be added without changing the existing learning routes.

---

## 4.8 Frontend 404 and Deep Links

Unknown frontend URLs should render a learner-friendly `NotFoundPage` rather than a blank screen.

Because `BrowserRouter` uses normal-looking paths, the development/demo server must serve the React application entry point for unknown non-API paths so that refreshing a nested route does not produce a server-level 404.

API paths under `/api/v1/...` must continue to be handled by Flask through the configured Vite proxy rather than by the frontend router.

---

# 5. Component & State Structure

## 5.1 Recommended `src/` Structure

```text
frontend/src/
├── app/
│   ├── App.jsx
│   ├── routes.jsx
│   ├── providers.jsx
│   └── guards/
│       ├── RequireAuth.jsx
│       ├── RequireLanguage.jsx
│       └── GuestRoute.jsx
│
├── layouts/
│   ├── PublicLayout.jsx
│   └── AppLayout.jsx
│
├── pages/
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── LanguageSetupPage.jsx
│   ├── DashboardPage.jsx
│   ├── ReferencePage.jsx
│   ├── GrammarPage.jsx
│   ├── GrammarLessonPage.jsx
│   ├── VocabularyPage.jsx
│   ├── VocabularyTopicPage.jsx
│   ├── VocabularyStudyUnitPage.jsx
│   ├── ConjugationPage.jsx
│   ├── ConjugationLessonPage.jsx
│   ├── PracticePage.jsx
│   ├── MixedPracticePage.jsx
│   ├── ReviewLaterPage.jsx
│   └── NotFoundPage.jsx
│
├── components/
│   ├── common/
│   └── navigation/
│
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── learning/
│   ├── grammar/
│   ├── vocabulary/
│   ├── conjugation/
│   └── practice/
│
├── context/
│   └── AuthContext.jsx
│
├── hooks/
│   ├── useAuth.js
│   ├── useDashboard.js
│   ├── useActivityCalendar.js
│   ├── useLearningUnitState.js
│   ├── usePractice.js
│   └── useTranslation.js
│
├── api/
│   ├── apiClient.js
│   ├── authApi.js
│   ├── dashboardApi.js
│   ├── grammarApi.js
│   ├── vocabularyApi.js
│   ├── conjugationApi.js
│   ├── referenceApi.js
│   ├── learningStateApi.js
│   └── practiceApi.js
│
├── i18n/
│   ├── vi.js
│   └── en.js
│
├── utils/
│   ├── dateUtils.js
│   ├── formatUtils.js
│   └── routeHelpers.js
│
└── styles/
    ├── tokens.css
    └── globals.css
```

The exact set of component files may grow as implementation proceeds, but the responsibility boundaries should remain stable.

---

## 5.2 Folder Responsibilities

### `app/`

Owns application composition:

- root application component;
- route definitions;
- provider composition;
- route guards.

It should not contain Dashboard, Grammar, Vocabulary, Conjugation, or Practice feature UI.

### `layouts/`

Owns reusable page frames.

`PublicLayout` may wrap public/guest-facing screens.

`AppLayout` wraps the authenticated application and provides the header (brand, main navigation, language selector, logout), the primary content container, and the footer.

### `pages/`

Owns route-level screens.

A page coordinates page-specific data loading, page-level state, and feature composition.

### `components/`

Owns UI reused across unrelated features.

### `features/`

Owns UI and interaction components that belong to one business feature or one shared learning-domain concept.

### `context/`

Owns application-wide React Context state only.

### `hooks/`

Owns reusable React stateful logic.

### `api/`

Owns browser-to-Flask HTTP integration.

### `i18n/`

Owns fixed frontend interface copy for Vietnamese and English, using the terminology in §9.4.

Dynamic curriculum content is not duplicated here; it comes from the backend already localized for the learner.

### `utils/`

Owns pure JavaScript helpers that do not render UI and do not depend on React hooks.

### `styles/`

Owns global design tokens and global baseline styling.

Component/page-specific styles should remain colocated with their owner where practical.

---

## 5.3 Shared Components

A component belongs in shared `components/` only when it is reusable across unrelated features.

Recommended initial shared components include:

```text
components/common/
├── LoadingState.jsx
├── ErrorState.jsx
├── EmptyState.jsx
├── ProgressBar.jsx
├── Breadcrumbs.jsx
└── PageHeader.jsx

components/navigation/
├── NavigationBar.jsx
├── MobileNavMenu.jsx
└── LanguageSelector.jsx
```

Examples:

- `ProgressBar` can be used by Dashboard and multiple learning modules;
- `Breadcrumbs` can be used by Grammar, Vocabulary, Conjugation, and Reference pages;
- `StreakCard` is not shared because it belongs specifically to Dashboard.

The Dashboard also uses small visual primitives described in §7.6 — **Badge**, **IconTile** (subject-accented icon square), and **SectionHeading**. They start as Dashboard-local components and move into `components/common/` when a second, unrelated feature uses them.

General rule:

> Reusable across unrelated features -> shared component.  
> Belongs to one product feature -> feature component.

---

## 5.4 Feature Components

### 5.4.1 Authentication

```text
features/auth/
├── LoginForm.jsx
└── RegisterForm.jsx
```

These components are reusable within authentication pages but are not generic application UI.

### 5.4.2 Dashboard

```text
features/dashboard/
├── DashboardGreeting.jsx
├── StreakCard.jsx
├── ActivityCalendar.jsx
├── ContinueLearningCard.jsx
├── ModuleProgressSection.jsx
├── ModuleProgressCard.jsx
├── MixedPracticeCard.jsx
├── ReviewLaterCard.jsx
├── RecentPracticeList.jsx
└── RecentPracticeItem.jsx
```

Responsibilities:

| Component | Responsibility |
|---|---|
| `DashboardGreeting` | French greeting selected by the rule in §7.7 plus the support-language welcome message |
| `StreakCard` | Current streak, longest streak, and guidance on which activities maintain the streak |
| `ActivityCalendar` | Monthly Learning Activity Calendar; owns month-navigation state and its own month request (`useActivityCalendar`) |
| `ContinueLearningCard` | The unfinished learning unit to resume, or the explore state when `continue_learning` is `null` (replaces the former `ExploreLearningSection`) |
| `ModuleProgressSection` / `ModuleProgressCard` | One card per module (Vocabulary, Grammar, Conjugation) with learned/total, percentage bar, and a link to the module page |
| `MixedPracticeCard` | Mixed Practice entry point, or the unavailable explanation when `mixed_practice.available` is `false` |
| `ReviewLaterCard` | Saved Review Later count and link to `/review-later` |
| `RecentPracticeList` / `RecentPracticeItem` | Recent Practice presented as a list of rows (not a table) |

### 5.4.3 Shared Learning Experience

```text
features/learning/
├── LearningUnitHeader.jsx
├── LearningUnitActions.jsx
└── LearningContent.jsx
```

These represent concepts shared by Grammar, Vocabulary, and Conjugation learning units.

`LearningUnitActions` may include:

```text
Mark as Learned
Review Later
Practice
```

### 5.4.4 Grammar

```text
features/grammar/
├── GrammarPartSection.jsx
├── GrammarChapterSection.jsx
└── GrammarLessonContent.jsx
```

### 5.4.5 Vocabulary

```text
features/vocabulary/
├── VocabularyCategorySection.jsx
├── VocabularyTopicSection.jsx
├── VocabularySubtopicSection.jsx
├── VocabularyStudyUnitCard.jsx
└── VocabularyEntry.jsx
```

### 5.4.6 Conjugation

```text
features/conjugation/
├── TenseSection.jsx
├── ConjugationLessonCard.jsx
└── ConjugationTable.jsx
```

### 5.4.7 Practice

```text
features/practice/
├── PracticeHeader.jsx
├── PracticeProgress.jsx
├── QuestionRenderer.jsx
├── PracticeReview.jsx
├── PracticeResult.jsx
├── ResultSummary.jsx
├── AnswerFeedback.jsx
│
└── questions/
    ├── McqQuestion.jsx
    ├── FillBlankQuestion.jsx
    └── OrderingQuestion.jsx
```

`QuestionRenderer` selects the correct UI by `question_type`:

```text
mcq
-> McqQuestion

fill_blank
-> FillBlankQuestion

ordering
-> OrderingQuestion
```

This avoids hard-coding every question type directly inside `PracticePage` and allows future question types to be added without rewriting the full Practice screen.

---

## 5.5 Context Design

The MVP uses one main global Context:

```text
AuthContext
```

Conceptually it exposes:

```text
currentUser
isAuthLoading
isAuthenticated
login()
register()
logout()
refreshUser()
updateSupportLanguage()
```

`support_language` remains part of the authenticated learner state and should not be duplicated into a separate independent language source of truth.

Do not create separate global contexts for Dashboard data, Grammar content, Practice answers, filters, or temporary form state.

If the application later develops genuinely independent global concerns, new Context providers may be introduced deliberately rather than preemptively.

---

## 5.6 Custom Hooks

### `useAuth()`

Provides the public interface to `AuthContext`.

Components should prefer:

```text
useAuth()
```

over directly depending on the Context object throughout the codebase.

### `useDashboard()`

Owns Dashboard request state such as:

```text
data
isLoading
error
reload()
```

### `useActivityCalendar()`

Owns the Learning Activity Calendar month request separately from the Dashboard aggregate, so switching months does not reload the rest of the Dashboard:

```text
year / month
data
isLoading
error
goToPreviousMonth()
goToNextMonth()
reload()
```

It never requests a month later than the current month.

### `useLearningUnitState()`

Owns reusable learner-state interactions such as:

```text
open learning unit
mark / unmark learned
add / remove Review Later
mutation loading/error state
```

Persistent truth still comes from the backend response.

### `usePractice()`

Owns the temporary Practice interaction lifecycle.

Conceptually:

```text
practiceRunId
questions
answers
phase
result
error

startNormalPractice()
startMixedPractice()
setAnswer()
submitPractice()
resetPractice()
```

Recommended phases:

```text
loading
answering
reviewing
submitting
result
error
```

### `useTranslation()`

Provides fixed interface text from the selected frontend locale dictionary.

It must not become a duplicate localization engine for curriculum content returned by Flask.

---

## 5.7 State Ownership Matrix

| State / Data | Frontend Owner | Global? | Authoritative Persistent Truth |
|---|---|---:|---|
| Current authenticated user | `AuthContext` | Yes | Flask session + database |
| `support_language` | `AuthContext.currentUser` | Yes | Database |
| Login/Register form input | Local form/page state | No | No, until submitted |
| Dashboard response | `DashboardPage` / `useDashboard` | No | Backend |
| Activity Calendar month + data | `ActivityCalendar` / `useActivityCalendar` | No | Backend |
| Mobile navigation menu open/closed | `MobileNavMenu` | No | No persistence required |
| Grammar browse/detail data | Grammar page/hook | No | Backend |
| Vocabulary browse/detail data | Vocabulary page/hook | No | Backend |
| Conjugation browse/detail data | Conjugation page/hook | No | Backend |
| Expanded/collapsed UI | Owning component | No | No persistence required |
| Filter/tab selection | Owning page/component | No | No persistence unless explicitly required |
| Learned state display | Page/hook after API response | No | Backend |
| Review Later display | Page/hook after API response | No | Backend |
| Current Practice questions | `usePractice` | No | Temporary Practice run + API response |
| Current Practice answers | `usePractice` | No | Temporary React state until submit |
| Practice result | `usePractice` | No | Submit response / completed backend summary |
| Practice score/correctness | Display only | No | Backend |
| Progress | Display only | No | Backend |
| Current/longest streak | Display only | No | Backend |

General rule:

> Frontend state is not persistent truth unless the backend has confirmed and stored it.

---

## 5.8 Practice State Lifecycle

Normal Practice and Mixed Practice share the same interaction lifecycle:

```text
start
  |
  v
questions loaded
  |
  v
answering
  |
  v
review answers
  |
  v
final submit
  |
  v
backend validation + scoring
  |
  v
result feedback
```

The learner must be able to review and change answers before final submission.

Correct-answer information must not be exposed before final submission.

Leaving an unfinished Practice flow does not create completed Practice History or streak activity.

Frontend Practice state should therefore remain temporary and should not be written to persistent browser storage for the MVP.

---

# 6. API Client Design

## 6.1 API Boundary

React communicates with Flask only through the approved HTTP API.

Conceptually:

```text
Page / Hook
    |
    v
Feature API Module
    |
    v
apiClient.js
    |
    v
/api/v1/...
    |
    v
Flask
```

The frontend must not:

- query SQLite;
- import Python backend modules;
- depend on raw database row shapes;
- send a `user_id` as learner identity authority.

---

## 6.2 `apiClient.js`

`apiClient.js` owns HTTP behavior shared by all frontend API calls:

- relative `/api/v1/...` requests;
- JSON request serialization;
- JSON response parsing;
- success-envelope unwrapping;
- API error-envelope normalization;
- network/fetch failure normalization;
- session-cookie-compatible same-origin requests.

The API client should expose predictable errors such as an `ApiError`-style object containing at least:

```text
status
code
message
details
```

It should not own feature-specific UI messages or rendering decisions.

---

## 6.3 Feature API Modules

### `authApi.js`

Conceptual operations:

```text
register()
login()
logout()
getCurrentUser()
updateSupportLanguage()
```

### `dashboardApi.js`

```text
getDashboard()
getActivityCalendar(year, month)
```

### `grammarApi.js`

```text
getGrammar()
getGrammarLesson(slug)
```

### `vocabularyApi.js`

```text
getVocabulary()
getVocabularyTopic(topicSlug)
getVocabularyStudyUnit(slug)
```

### `conjugationApi.js`

```text
getConjugation()
getConjugationLesson(slug)
```

### `referenceApi.js`

```text
getReference(slug)
```

### `learningStateApi.js`

```text
openLearningUnit(slug)
updateLearningUnitState(slug, state)
getReviewLater()
```

### `practiceApi.js`

```text
startNormalPractice(slug)
startMixedPractice(options)
submitPractice(practiceRunId, answers)
```

Feature API modules know API paths and request/response shapes. They do not render UI.

---

## 6.4 Relative API URLs

Frontend application code uses:

```text
/api/v1/...
```

Do not hard-code:

```text
http://localhost:5000/api/v1/...
```

The Vite development proxy forwards API requests to Flask.

This preserves a stable frontend integration boundary and a simple same-origin browser model during local development.

---

## 6.5 Success and Error Envelopes

The frontend expects the API contract's success form:

```json
{
  "data": {}
}
```

and error form:

```json
{
  "error": {
    "code": "...",
    "message": "...",
    "details": {}
  }
}
```

The API client should normalize these once rather than requiring every page to parse them differently.

---

## 6.6 Loading / Error / Empty / Data States

Any page or hook that loads remote data must account for:

```text
loading
error
empty when valid but no data exists
data
```

Recommended rendering pattern:

```text
isLoading
-> LoadingState

error
-> ErrorState

valid empty collection
-> EmptyState

data
-> normal page content
```

A blank page is not an acceptable generic loading or error state.

The Dashboard-specific states are defined in §7.7.

---

## 6.7 Session Expiry / Unauthorized Responses

If a protected API request returns an authentication failure, the frontend should re-resolve or clear the current authenticated-user state and route the learner back to Login as appropriate.

The UI must not silently treat a `401` authentication error as an empty data response.

No auth token is stored in `localStorage` or `sessionStorage`; authentication is based on the Flask session cookie.

---

## 6.8 Language Changes

When the learner changes support language:

```text
LanguageSelector
-> PATCH /api/v1/me/preferences
-> update currentUser.support_language
-> refresh language-sensitive page data as needed
```

Fixed interface copy switches using the frontend locale dictionary.

Dynamic curriculum content is refetched from the backend so that generic fields such as `title`, `content`, `meaning`, `prompt`, and `explanation` match the newly selected support language.

Changing support language must not reset learning state, Review Later, Practice History, progress, or streak information.

---

# 7. UI / Wireframe Design

The approved visual baseline is the normalized Dashboard. Values in this section are taken from it. New pages reuse these tokens and patterns rather than introducing page-specific variants.

## 7.1 UI Goals

The interface should feel:

- friendly;
- calm;
- study-focused;
- lightly playful;
- clean and soft rather than corporate or visually heavy;
- clear enough for extended reading and Practice sessions.

The visual style must not reduce readability or make learning content feel decorative at the expense of clarity.

The design should avoid:

- pure-white full-page backgrounds (white is for card surfaces);
- heavily saturated colors on large surfaces;
- large dark color blocks (dark fills are reserved for primary buttons);
- dense, rigid data-dashboard layouts;
- glossy 3D visual effects;
- decorative gradients;
- excessive decorative shapes;
- dense visual noise;
- display-style fonts for long learning passages.

---

## 7.2 Visual Direction

Working visual concept:

> **A warm, calm French study space: a cream page, white rounded cards, an amber-brown brand accent, one soft accent color per learning module, and a small croissant mascot.**

Core characteristics:

- warm cream page background with white card surfaces;
- amber-brown brand primary for brand, section icons, focus, and active states;
- one accent color family per learning module (§7.3), used consistently wherever that module appears;
- dark warm brown text instead of pure black;
- thin warm borders and flat elevation — shadows only for primary buttons and interactive hover;
- rounded cards and controls;
- outlined icons in soft tinted tiles rather than doodle illustrations;
- the croissant mascot as the only illustration;
- generous spacing and a clear reading hierarchy.

French blue and red appear as module accents, not as large tricolor blocks. The interface suggests a French identity without being dominated by the French flag.

---

## 7.3 Design Tokens

These are the approved baseline values. `styles/tokens.css` defines them; components consume tokens rather than hard-coding values. Values used by only one component (for example calendar intensity colors or the streak illustration tint) stay component-local until a second use appears.

### Core colors

| Token | Value | Role |
|---|---|---|
| `--color-background` | `#faf7f2` | Page background; fill for nested rows, badges, progress tracks, secondary buttons |
| `--color-card` | `#ffffff` | Card surface |
| `--color-border` | `#eadbcc` | Default 1px border |
| `--color-heading` | `#2b2118` | Headings; primary-button fill |
| `--color-text` | `#231918` | Body text |
| `--color-muted` | `#554336` | Secondary text, subtitles, captions, navigation |
| `--color-description` | `#4e453e` | Descriptive body copy |
| `--color-primary` | `#8d4b00` | Brand accent: brand name, section icons, focus ring, active navigation, Mixed accent |
| `--color-primary-dark` | `#6b3700` | Badge text, emphasized values |
| `--color-primary-soft` | `#fff5e6` | Tinted fills |
| `--color-primary-border` | `#f0dec0` | Tinted borders |
| `--color-chip-border` | `#eedcbb` | Pill control groups (navigation, language selector) |
| `--color-chip-background` | `rgb(247 234 208 / 70%)` | Pill control groups |

### Module accent families

| Module | Base | Strong | Dark | Soft | Border |
|---|---|---|---|---|---|
| Vocabulary (blue) | `#0058be` | `#085ac0` | `#004395` | `#f0f5ff` | `#c5d7ff` |
| Grammar (gold) | `#9a6b12` | — | `#80570d` | `#fff8e1` | `#ead79a` |
| Conjugation (orange) | `#b84824` | `#c2410c` | `#9a3412` | `#fff0ed` | `#fdcac1` |
| Mixed (brand primary) | `#8d4b00` | — | `#6b3700` | `#fff5e6` | `#f0dec0` |

A subject class (for example `subject-vocabulary`) maps a family to the generic variables `--accent`, `--accent-soft`, `--accent-border`, `--progress-color`, `--badge-color`, and `--link-color`. Components read only the generic variables and never hard-code module colors.

No success / warning / danger role is defined yet. Define one when a page first needs it (for example Practice Result), and never rely on color alone for correct/incorrect states.

### Spacing, radius, elevation

| Group | Tokens |
|---|---|
| Spacing scale | `--space-xs` 4px · `--space-sm` 8px · `--space-md` 16px · `--space-lg` 24px · `--space-xl` 36px |
| Radius | `--radius-card` 24px (cards) · `--radius-small` 16px (compact cards, list rows, buttons) · 12px (icon tiles, callouts) · pill `9999px` (badges, pill groups, progress tracks) |
| Elevation | none at rest · `--shadow-sm` (primary button, interactive-card hover) · `--shadow-md` (primary-button hover) |

Off-scale values present in the Dashboard (2, 6, 10, 12, 20px gaps; 8px radius) remain component-local and should not be copied into new components without a reason.

---

## 7.4 Typography Direction

Approved pairing:

```text
Headings / numeric highlights
-> Be Vietnam Pro 600-700

Body / navigation / controls / forms / learning content / questions
-> Nunito Sans 400-700
```

Rationale:

- Be Vietnam Pro gives clear, friendly headings with full Vietnamese diacritic support;
- Nunito Sans keeps longer Vietnamese/French text, forms, tables, questions, and feedback readable;
- neither is a handwriting face, so long reading stays comfortable.

Recommended usage:

| UI area | Typography |
|---|---|
| Page title / greeting | Be Vietnam Pro 700 |
| Section / card heading | Be Vietnam Pro 600 |
| Large numbers (streak, counts, scores) | Be Vietnam Pro 600-700, tabular figures |
| Navigation | Nunito Sans 500 (active 700) |
| Buttons | Nunito Sans 700 |
| Badges / small labels | Nunito Sans 600-700 |
| Body learning content | Nunito Sans 400 |
| Practice question | Nunito Sans 500-600 |
| Answer options / explanations | Nunito Sans 400-500 |
| Conjugation tables | Nunito Sans 400-600 |

Type scale (rem, 16px root):

| Token | Size | Use |
|---|---|---|
| `--text-caption` | 0.75 | Captions, badges, meta |
| `--text-label` | 0.8125 | Navigation, small labels |
| `--text-small` | 0.875 | Subtitles, card descriptions |
| `--text-body` | 0.9375 | Body, buttons |
| `--text-card-title` | 1.0625 | Card titles |
| `--text-section` | 1.125 → 1.25 at ≥640px | Section headings |
| `--text-feature` | 1.25 → 1.375 at ≥640px | Feature-card titles |
| `--text-display` | 1.75 → 2 at ≥640px | Page title / greeting |

Line height: body 1.6, headings 1.4, labels 1.5. Letter spacing: headings −0.015em, labels +0.01em. Numbers that change or are compared (counts, percentages, dates in grids) use `font-variant-numeric: tabular-nums`.

The implementation must verify Vietnamese and French diacritics, including examples such as:

```text
ă â đ ê ô ơ ư
é è ê ë à â î ï ô ù û ü ÿ ç œ
```

Long curriculum text is always set in the body font.

---

## 7.5 Mascot, Logo, and Icons

### Mascot / logo

The brand concept is a simple croissant mascot:

- croissant rendered in butter-yellow / cream tones;
- cute face;
- round glasses;
- holding a small study book;
- book may include a subtle French-flag motif;
- small floating French characters such as `é`, `ç`, and `à` around the head;
- light, simple line style;
- no glossy 3D rendering;
- no photorealism;
- no excessive detail.

The mascot may appear in:

- brand/logo area;
- Landing page;
- Dashboard streak card;
- empty/encouragement states;
- subtle Practice/Result encouragement.

Decorative illustrations must not carry information that is unavailable in text, and use empty `alt` text when adjacent text already conveys the meaning.

### Icons

- Material Symbols Outlined, default 20px; always decorative (`aria-hidden="true"`) with a visible text label or an accessible name on the control.
- Sizes by context: section-heading icon 24px; icon-tile glyph 22px in a 40px tile (20px in a 36px compact tile); inline meta icons 14–18px.
- The filled variant is used only for a single emphasis (for example the longest-streak badge).
- A trailing `arrow_forward` marks navigation CTAs.

---

## 7.6 App Layout and Shared UI Patterns

### Authenticated app shell

```text
+----------------------------------------------------------------------------+
| [logo] Brand   ( Dashboard | Vocabulary | Grammar | Conjugation )  VI|EN  ⎋ |
+----------------------------------------------------------------------------+
|                                                                            |
|                       Main responsive content                              |
|                                                                            |
+----------------------------------------------------------------------------+
| [icon] Français Learning Journey • tagline                                 |
+----------------------------------------------------------------------------+
```

- A fixed top header (not a sidebar), translucent white with a bottom border. It contains the brand (logo + name), the main navigation as a pill group, the VI/EN language selector as a segmented control, and Logout.
- Main content starts below the fixed header and scrolls normally.
- A simple footer with a top border closes every authenticated page.
- Header, main content, and footer share one centered container (§8.3).
- Header responsive behavior is defined in §8.5.

### Public layout

Public pages should be visually lighter and simpler than the authenticated Dashboard.

They may contain:

```text
Brand / mascot
Main form or landing content
Minimal supporting navigation
```

A public support-language selector is not required for the MVP.

### Shared UI patterns

| Pattern | Baseline |
|---|---|
| Card | 1px `--color-border`, `--radius-card`, white surface, padding 16px (24px from 640px); feature/hero cards may use 36px padding from 1024px; no shadow at rest; height grows with content |
| Compact card / list row | `--radius-small`; list rows inside a card use the page-background fill plus a border; interactive rows tint with their `--accent-soft` on hover; interactive cards gain `--shadow-sm` on hover |
| Primary button | `--color-heading` fill, white text, 700, `--radius-small`, `--shadow-sm`; hover darker with `--shadow-md`; active moves down 2px; normally one primary action per card |
| Secondary button | Page-background fill, border, heading-color text; hover inverts to the dark fill |
| Text-link CTA | Accent color, 700, trailing arrow; underline on hover |
| Arrow motion | Trailing arrow icons shift 4px on hover |
| Badge | Pill, 1px border, page-background fill, caption size, 700, `--badge-color` text |
| Progress bar | 8px pill track (border, page-background fill), `--progress-color` fill; label row with caption label on the left and a right-aligned 700 tabular value; `aria-valuenow` always matches the displayed value |
| Section heading | (a) page-level group: 24px primary icon + `h2`; (b) card-level header: icon tile + `h2` + muted subtitle. A control may sit on the right; the row wraps |
| Icon tile | 40×40px (36×36px compact), 12px radius, `--accent-soft` fill, `--accent-border`, `--accent` glyph |
| Pill group / segmented control | Selected item: white fill, primary text, 700; expressed with `aria-pressed` or `aria-current` |
| Inline notice | Primary-soft callout with an info icon for unavailable or explanatory states |
| Focus | 2px `--color-primary` outline with 2px offset on every interactive element |
| Motion | 150ms transitions; all animation and transitions disabled under `prefers-reduced-motion` |
| Disabled | Opacity 0.35, default cursor |

---

## 7.7 Dashboard

The Dashboard is the main authenticated home screen. It is the approved visual reference for the application.

### Layout

```text
Header (app shell)

Greeting (h1, French) + short support-language welcome message
-----------------------------------------------------------------------

+-- Streak card (4/12) ---+  +-- Learning Activity Calendar (8/12) ------+
| current streak          |  | title + month switcher                    |
| longest streak (badge)  |  | month grid     | summary + legend         |
| streak tip              |  +-------------------------------------------+
+-------------------------+

+-- Continue Learning (full width, accent bar) --------------------------+
| module • parent section                                               |
| Lesson x/y: unit title                         [ Continue learning -> ] |
+-----------------------------------------------------------------------+

(icon) Learning progress
+-- Vocabulary --+  +-- Grammar --+  +-- Conjugation --+

(icon) Strengthen your knowledge
+-- Mixed Practice (7/12) ------+  +-- Review Later (5/12) --+

+-- Recent Practice ----------------------------------------------------+
| [tile] Type: content label (link)                          score %    |
|        date, time                                   correct x/y       |
| ...                                                                   |
+-----------------------------------------------------------------------+

Footer
```

Column spans apply from 1024px; narrower behavior is defined in §8.4.

### Content and data mapping

| Section | Shows | Data source |
|---|---|---|
| Greeting | `Bienvenue !` / `Coucou !` / `Bonjour !` (French, `lang="fr"`) + welcome message in the support language | Greeting rule below |
| Streak card | "N days in a row", longest streak badge, tip that completing a Practice or Mixed Practice session keeps the streak | `streak.current`, `streak.longest` |
| Learning Activity Calendar | Month grid with intensity, summary, legend | `GET /api/v1/me/activity-calendar` |
| Continue Learning | Module, parent section, lesson position, unit `title_fr`, CTA to the unit route | `continue_learning.unit_type`, `slug`, `title_fr`; parent section and position pending (§15) |
| Learning progress | One card per module in order Vocabulary, Grammar, Conjugation: total badge, learned/total, percentage bar, link to the module page | `progress.vocabulary`, `progress.grammar`, `progress.conjugation` |
| Mixed Practice | Description and Start CTA, or unavailable notice | `mixed_practice.available` |
| Review Later | Saved-unit count and link to `/review-later` | `review_later_count` |
| Recent Practice | Type, content label (linked for normal Practice), completion date and time, accuracy, correct/total | `recent_practice[]` |

### Display rules

- **Greeting.** `Coucou !` when `streak.current >= 30`; `Bienvenue !` for a learner entering the Dashboard for the first time; otherwise `Bonjour !`. Until the API exposes a first-visit signal (§15), the frontend treats the Dashboard response as a first visit when it matches the new-learner state: no learned units, `streak.longest === 0`, `continue_learning === null`, `review_later_count === 0`, and `recent_practice` empty.
- **Percentages** are derived in the frontend: module progress `round(learned / total × 100)`, shown as 0% when `total` is 0; accuracy `round(correct_count / total_questions × 100)`.
- **Vocabulary** progress counts Study Units, never individual words.
- **Continue Learning** shows no completion percentage: learning units are either learned or not, and no in-unit progress exists.
- **Recent Practice Type** is derived from `practice_type` and `unit_type`. Normal rows show `Type: title_fr` where `title_fr` links to the unit route built from `unit_type` + `slug`. Mixed rows show the single label "Mixed Practice" with no link.
- **Recent Practice titles** wrap and clamp to two lines, with the full text available as a `title` attribute.
- **Dates** use `<time datetime>` and relative wording for today and yesterday, otherwise day and month (plus the year when it is not the current year), always followed by the time (§9.4).
- **Perfect score** (100%) uses the `--color-perfect` accent in addition to the number.
- The Dashboard shows the recent subset returned by the API (5–10 rows) without pagination.

### Learning Activity Calendar presentation

The API returns only dates with activity (API §8.2). The frontend derives the grid:

- month view with weeks starting on Monday; the calendar opens on the current month;
- a previous-month button; the next-month button is disabled on the current month because future months are rejected by the API;
- intensity from `activity_count`: 1–2 low, 3 medium, 4 or more high; dates with no entry show "no practice"; dates after today show "not yet"; both use the neutral swatch;
- each day has a text alternative (date and count or state); today carries `aria-current="date"`;
- the summary reads "N days with practice this month", from the length of `days`; an empty month shows "No practice days this month yet.";
- the legend reads "Less [low][medium][high] More" plus the neutral swatch for "No practice / Not yet";
- a month request has its own loading and inline error state with a retry action, without blocking the rest of the Dashboard;
- the calendar is informational only and uses the same completed-Practice activity concept as the streak.

### Dashboard states

| Condition | Presentation |
|---|---|
| Dashboard request loading | `LoadingState` in place of the page content |
| Dashboard request failed | `ErrorState` with a short message and a "Try again" action calling `reload()`; `401` follows §6.7 |
| `continue_learning === null` | Explore state: a short heading and sentence plus links to Vocabulary, Grammar, and Conjugation |
| `mixed_practice.available === false` | The Start button is replaced by an inline notice explaining that at least one unit must be marked as learned |
| `review_later_count === 0` | The count is replaced by a short hint on how to save a unit; the list link remains |
| `recent_practice` empty | A short empty message inside the Recent Practice card |
| Streak 0 / progress 0 | Shown normally as 0 values; the streak tip stays visible |

### Dashboard behavior

- the greeting is short and visually prominent;
- Current Streak and Longest Streak must be easy to identify;
- explain that completed normal Practice or Mixed Practice maintains the streak;
- Continue Learning is one of the primary CTAs;
- module cards show Vocabulary, Grammar, and Conjugation separately;
- Mixed Practice and Review Later remain visible without being permanent navbar items;
- Recent Practice shows a limited latest set rather than a full history view;
- normal Recent Practice content labels link back to the related learning content;
- Mixed Practice rows do not require a learning-unit link;
- the Learning Activity Calendar uses the same completed-Practice activity concept as the streak.

### Dashboard-only visual elements

These belong to the Dashboard and are not application-wide rules: the welcome divider, the streak illustration, the calendar intensity colors, the Continue Learning accent bar, the 4/8 and 7/5 desktop column splits, the large counters, and the perfect-score color.

---

## 7.8 Grammar Browse Wireframe

```text
Breadcrumb / Page Header
Grammar
Short description + overall progress

Part A
  Chapter 1
    [Lesson card]
    [Lesson card]

  Chapter 2
    [Lesson card]

Part B
  ...
```

Each lesson item should support:

- localized title from API;
- French source title where useful;
- learned state;
- Review Later indication when useful;
- natural wrapping for long titles;
- clear click/tap target.

Part and Chapter titles come from API data rather than hard-coded frontend text.

---

## 7.9 Vocabulary Browse Wireframe

### Vocabulary root

```text
Page Header
Vocabulary
Progress

Category
  [Topic card] [Topic card] ...

Reference entry
  Alphabet & Accents
```

### Vocabulary Topic

```text
Breadcrumbs
Topic title

Subtopic A
  [Study Unit card]
  [Study Unit card]

Subtopic B
  [Study Unit card]
```

### Vocabulary Study Unit

```text
Breadcrumbs
Study Unit title
Learning actions

Vocabulary entries
+----------------------------------------------------+
| French word / expression                          |
| pronunciation if available                        |
| meaning                                            |
| example + translated example if available         |
+----------------------------------------------------+

[Mark as Learned] [Review Later] [Practice]
```

The exact number of entries is data-driven and must not be assumed by the layout.

---

## 7.10 Conjugation Browse / Lesson Wireframe

### Browse

```text
Page Header
Verb Conjugation
Progress

Tense section
  [Rule / Pattern Lesson card]
  [Rule / Pattern Lesson card]
```

### Lesson

```text
Breadcrumbs
Lesson title
Rule / pattern explanation

Conjugation table / structured examples

[Mark as Learned] [Review Later] [Practice]
```

Tables must remain readable on narrow screens without forcing the entire page to shrink to an unusable size.

---

## 7.11 Generic Learning Detail Pattern

Grammar Lesson, Vocabulary Study Unit, and Conjugation Lesson should share a familiar structure:

```text
Breadcrumbs
Title / metadata
Learning-unit state

Main learning content

Contextual actions
[Mark as Learned] [Review Later] [Practice]
```

This creates a consistent learner mental model even when each module renders different content.

Learning content may use Markdown where defined by the backend content model.

---

## 7.12 Practice Wireframe

The Practice UI should be focused and less visually busy than Dashboard.

```text
Practice title / source unit
Question progress

+----------------------------------------------------+
| Question prompt                                    |
|                                                    |
| Question-type-specific answer UI                   |
|                                                    |
+----------------------------------------------------+

[Previous]                      [Next / Review]
```

When all required answers are present:

```text
Review Answers
-> final Submit Practice
```

### Multiple Choice

Use large selectable answer cards/buttons with a clear selected state.

### Fill Blank

Use a clear labeled input area with enough width for expected French text.

### Sentence Ordering

Use reorderable word/phrase chips or tiles.

Do not make drag-and-drop the only available interaction if a keyboard/tap-friendly alternative can be provided. The ordering interaction must remain understandable on mobile.

### Submission behavior

- learners answer all questions before final submission;
- learners can review and change answers before submit;
- correct answers are not shown during answering;
- frontend does not calculate the authoritative result;
- final submission is sent once to the backend;
- duplicate or invalid submissions surface an appropriate error state.

---

## 7.13 Result Wireframe

Result is rendered from the final Practice submission response.

```text
+----------------------------------------------------+
| Result Summary                                     |
| correct / total                                    |
| accuracy                                           |
+----------------------------------------------------+

Question Review

Question 1
- learner answer
- correct / incorrect state
- correct answer
- explanation

Question 2
...

[Back to Learning] [Practice Again] [Dashboard]
```

For Mixed Practice, also show Content Covered information when returned by the API.

The Result UI should be encouraging and informative rather than pass/fail-oriented because Practice score does not gate progress or access.

Correct and incorrect states must not rely on color alone.

---

## 7.14 Review Later Wireframe

```text
Page Header
Review Later
Short explanation

Grammar
  [saved learning unit]

Vocabulary
  [saved learning unit]

Conjugation
  [saved learning unit]
```

Each item should:

- link back to its learning content;
- show its current learned state independently;
- allow Review Later removal through the approved learner-state API.

The UI must not imply that Review Later means "not learned" because those states are independent.

---

## 7.15 Language Setup Wireframe

First-time Language Setup should be simple and focused:

```text
Brand / mascot
Choose your support language

[ Vietnamese ]
[ English    ]

[ Continue ]
```

The choice affects supporting interface/content language, not the target language: French remains the learning target.

---

# 8. Responsive Behavior

## 8.1 General Responsive Model

The application uses a fluid responsive layout.

Responsive behavior means elements:

- resize within sensible limits;
- wrap text naturally;
- change column count when space becomes insufficient;
- stack when necessary;
- preserve readable typography and touch targets.

Responsive behavior must **not** be implemented by scaling the entire desktop page down like an image.

Layouts are mobile-first and use `min-width` breakpoints.

---

## 8.2 Main Page Scrolling

The normal application uses one primary vertical page scroll.

Rules:

- page height grows naturally with content;
- users can scroll vertically when content exceeds the viewport;
- do not force the entire Dashboard into one viewport;
- do not use page-level `height: 100vh` together with `overflow: hidden` in a way that clips normal content;
- cards normally grow with their content rather than gaining independent vertical scrollbars;
- nested scroll areas should be introduced only when a specific component genuinely requires them.

A page that renders only a blank area because content has been clipped or hidden is a frontend defect.

---

## 8.3 Responsive Content Container

Approved baseline:

- one centered container with `max-width: 1280px`, shared by header, main content, and footer;
- horizontal padding of 16px on small screens, 24px from 640px, and 40px from 1024px;
- breakpoints at **640px**, **768px**, and **1024px**, plus a compact-header range from 768px to 1199px (§8.5);
- grids start as a single `minmax(0, 1fr)` column and gain columns at the breakpoints; text containers use `min-width: 0` and `overflow-wrap: anywhere` where API text may be long.

The team should manually test representative widths such as:

```text
390 px
768 px
1024 px
1440 px
1920 px
```

and widths between those values.

---

## 8.4 Dashboard Responsive Rules

| Area | Below breakpoint | At / above breakpoint |
|---|---|---|
| Streak card + Activity Calendar | Stacked (< 1024px) | Side by side, 4/8 columns (≥ 1024px) |
| Calendar summary + legend | Below the grid (< 1024px) | Right-hand column beside the grid (≥ 1024px) |
| Continue Learning CTA | Full width below the content (< 1024px) | Beside the content (≥ 1024px) |
| Module cards | One column (< 768px) | Three columns (≥ 768px) |
| Mixed Practice + Review Later | Stacked (< 1024px) | Side by side, 7/5 columns (≥ 1024px) |
| Recent Practice rows | Result stacks below the details with a divider (< 768px) | Details and result on one row (≥ 768px) |

Additional rules:

- Recent Practice is a list at every width; it is never rendered as a table;
- the Continue Learning title and lesson line wrap naturally;
- Recent Practice titles clamp to two lines;
- the calendar preserves its weekday/date grid rather than shrinking text excessively.

---

## 8.5 Navigation Responsive Rules

| Width | Header behavior |
|---|---|
| ≥ 1200px | Full header: logo and brand name, navigation pill group, language selector, Logout with label |
| 768–1199px | Compact header: the brand name is visually hidden (logo stays), tighter navigation spacing, Logout icon-only |
| < 768px | Navigation links move into a menu button that opens a panel below the header |

Rules:

- the menu button exposes `aria-expanded` and `aria-controls`; the panel closes on Escape, on navigation, and when the viewport widens past 768px;
- the Language Selector and Logout remain visible at every width;
- icon-only controls keep an accessible name;
- the brand must not force navigation items off-screen;
- text must not overlap or be clipped.

---

## 8.6 Learning Page Responsive Rules

- lesson titles may wrap across lines;
- hierarchical cards move from multi-column to fewer columns or one column;
- action buttons may wrap or stack;
- Vocabulary entries remain readable without horizontal clipping;
- Conjugation tables may use a controlled horizontal overflow area when genuinely necessary, rather than shrinking text below readable size;
- breadcrumbs may wrap or simplify visually while preserving navigation meaning.

---

## 8.7 Practice Responsive Rules

- keep the question area visually dominant;
- answer options stack vertically on narrow screens;
- ordering chips wrap cleanly;
- navigation/submit controls remain easy to tap;
- long French sentences wrap naturally;
- the page must not introduce horizontal scrolling for normal question content.

---

# 9. Localization and Data-Driven Content

## 9.1 Two Types of Text

The frontend handles two different text sources.

### Fixed interface copy

Examples:

```text
Dashboard
Log out
Continue learning
Practice
Review Later
Loading
Try again
```

These belong to frontend VI/EN locale dictionaries and use the terminology in §9.4.

### Dynamic learning/content copy

Examples:

```text
Grammar Part title
Chapter title
Lesson title
Vocabulary Topic title
Study Unit title
lesson content
meaning
example translation
question prompt
explanation
```

These are returned by the API and must not be duplicated as frontend constants.

---

## 9.2 Content Titles Are Not Hard-Coded in React

For example, the frontend should not create:

```text
LessonOneCard.jsx
LessonTwoCard.jsx
AdjectiveLesson.jsx
```

for fixed curriculum titles.

Instead, reusable UI receives data:

```text
lesson.title
lesson.title_fr
lesson.slug
lesson.state
```

and renders however many items the API returns.

The design must support:

- variable list sizes;
- long localized titles;
- line wrapping;
- future additional content without page-structure rewrites.

---

## 9.3 Markdown Content

Where backend content is authored as Markdown, the frontend should render the returned Markdown through one approved Markdown-rendering component.

Recommended ownership:

```text
features/learning/LearningContent.jsx
```

Do not implement separate Markdown parsing in Grammar, Vocabulary, and Conjugation pages.

Raw HTML inside Markdown should not be enabled by default unless a concrete content requirement justifies it and the safety implications are understood.

---

## 9.4 Terminology and Microcopy

### EN → VI terminology

Fixed UI copy uses these terms. The same concept always uses the same term on every page.

| Concept | EN UI | VI UI |
|---|---|---|
| Dashboard | Dashboard | Bảng điều khiển |
| Vocabulary | Vocabulary | Từ vựng |
| Grammar | Grammar | Ngữ pháp |
| Conjugation | Conjugation | Chia động từ |
| Lesson / learning unit (counted) | lesson(s) | bài |
| Module progress section | Learning progress | Tiến độ học tập |
| Progress (label) | Progress | Tiến độ |
| Continue Learning | Continue learning | Tiếp tục học |
| Practice | Practice | Luyện tập |
| Mixed Practice | Mixed Practice | Luyện tập tổng hợp |
| Recent Practice Type "Mixed" | Mixed | Tổng hợp |
| Review Later | Review Later | Xem lại sau |
| Review Later list | Review list | Danh sách xem lại |
| Dashboard group for Mixed Practice + Review Later | Strengthen your knowledge | Củng cố kiến thức |
| Recent Practice | Recent practice | Luyện tập gần đây |
| Learning Activity Calendar | Practice calendar | Lịch luyện tập |
| Learning streak | Learning streak | Chuỗi ngày học |
| Current streak value | N days in a row | N ngày liên tiếp |
| Longest streak | Longest: N days | Kỷ lục: N ngày |
| Mark as Learned | Mark as learned | Đánh dấu đã học |
| Learned (state) | Learned | Đã học |
| Start practice (CTA) | Start practice | Bắt đầu luyện tập |
| View a module's lessons (CTA) | View lessons | Xem bài học |
| Open the Review Later list (CTA) | Open review list | Mở danh sách xem lại |
| Support language | Support language | Ngôn ngữ hỗ trợ |
| Main navigation (accessible name) | Main navigation | Điều hướng chính |
| Log out | Log out | Đăng xuất |
| Loading | Loading… | Đang tải… |
| Try again | Try again | Thử lại |
| Tip | Tip | Mẹo nhỏ |

Avoid near-synonyms for these concepts (for example "hỗn hợp" for Mixed Practice, "ôn lại" for Review Later, "kỹ năng" for modules, or "điểm danh" for practice activity).

### Microcopy conventions

- **Case.** Sentence case for headings, labels, and buttons in both languages ("Luyện tập gần đây", "Recent practice"). In EN, the product feature names Mixed Practice and Review Later keep Title Case.
- **CTAs** start with a verb and name the concrete action; the same action always uses the same label.
- **Counts** are a number plus a unit ("14 ngày liên tiếp", "25 bài"). Fractions have no spaces: "18/25 bài", "Bài 4/6", "Đúng 19/20 câu".
- **Label and value** use a colon: "Kỷ lục: 28 ngày", "Mẹo nhỏ:".
- **Dates.** VI: "Hôm nay lúc 09:30", "Hôm qua lúc 18:15", "13 tháng 5 lúc 21:00"; EN: "Today at 09:30", "Yesterday at 18:15", "13 May at 21:00". Add the year when it is not the current year. "tháng" is lowercase inside a date; month labels on their own start with a capital ("Tháng 5").
- **Supporting text** is one short, friendly sentence ending with a period. Emoji are decorative only and marked `aria-hidden="true"`.
- **Scope.** Copy never mentions activities outside the MVP (listening, speaking, pronunciation scoring). Streak and calendar copy refer only to completed Practice and Mixed Practice.
- **French text** in the UI is marked `lang="fr"`. French greetings are not translated.
- **API content** (titles, content, meanings, prompts) is displayed as returned and never rewritten or duplicated in the dictionaries.
- The brand name "Français Learning Journey" is not translated.

---

# 10. Styling Strategy

## 10.1 CSS Modules

The frontend selects **CSS Modules** for page/component-scoped styles.

Examples:

```text
DashboardPage.module.css
PracticeResult.module.css
NavigationBar.module.css
```

Reasons:

- built-in support in the Vite workflow;
- avoids accidental global class collisions across a multi-member team;
- keeps styles close to the component that owns them;
- does not require an additional runtime styling framework;
- remains understandable for contributors learning standard CSS.

### Global CSS remains limited to:

```text
styles/tokens.css
styles/globals.css
```

`tokens.css` owns reusable design variables such as colors, module accent families, spacing, radii, shadows, typography sizes, and content widths (§7.3, §7.4).

`globals.css` owns document-level defaults such as box sizing, body background, base text behavior, links, focus behavior, reduced-motion handling, and root layout rules.

---

## 10.2 Styling Guardrails

Do not:

- use arbitrary unrelated colors per feature;
- redefine brand colors independently inside many components;
- hard-code module accent colors instead of using the subject accent variables;
- apply global selectors for feature-specific styling when a CSS Module can own it;
- remove visible keyboard focus states;
- hide layout overflow globally to mask responsive bugs;
- use fixed pixel heights for content cards whose content length is data-driven;
- rely on a single desktop screenshot size as the implementation target.

---

# 11. Accessibility and Usability

The frontend should aim for an accessible study experience consistent with WCAG 2.1 AA expectations where applicable to the MVP.

Implementation should preserve:

- semantic headings in logical order;
- semantic `nav`, `main`, `form`, `label`, `button`, and table structures where appropriate;
- visible keyboard focus;
- keyboard-operable navigation and form controls;
- sufficient text/background contrast;
- labels for form controls;
- error messages connected to the affected controls where practical;
- non-color indicators for correct/incorrect Practice feedback;
- meaningful button/link text;
- sufficient spacing and comfortable touch targets;
- readable line length and line height for learning content;
- motion kept subtle and non-essential.

Conventions established by the Dashboard:

- French text inside the page is marked `lang="fr"`;
- the active navigation item uses `aria-current="page"`, the current calendar day `aria-current="date"`, and selected segmented options `aria-pressed`;
- progress bars use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and an accessible label, kept equal to the visible value;
- calendar days and other color-coded status carry a text alternative; tooltips (`title`) are never the only way to get information;
- decorative icons, emoji, and illustrations are hidden from assistive technology or use empty `alt` text;
- icon-only controls (logout at compact widths, menu button) keep an accessible name in the support language;
- repeated link text (for example "View lessons" on each module card) includes visually hidden context so each link is distinguishable;
- accessible names and ARIA labels are localized like other fixed copy;
- all animation and transitions are disabled under `prefers-reduced-motion`.

Decoration supports the brand but must not interfere with reading order or interaction clarity.

---

# 12. Frontend Testing Strategy

The frontend should prioritize tests around shared behavior and high-risk interaction flows rather than snapshotting every visual detail.

Recommended automated-test focus:

### Routing / Auth

- protected route redirects when unauthenticated;
- authenticated learner cannot remain on Login/Register;
- `support_language === null` routes to Language Setup;
- authenticated learner with saved language can reach Dashboard.

### API client

- success envelope handling;
- normalized API errors;
- network failure behavior;
- unauthorized response handling.

### Auth state

- initial session-loading state;
- login updates current user;
- logout clears current user;
- language preference update updates current-user state.

### Practice

- `QuestionRenderer` selects the correct question component;
- answer changes update local Practice state;
- final submit uses the complete answer set;
- result view renders backend feedback;
- retry/reset behavior clears previous interaction state correctly.

### Learning state

- learned/review actions reflect confirmed API responses;
- Review Later remains independent from learned state.

### Key page states

- loading;
- error;
- empty;
- normal data rendering.

Manual responsive and visual checks remain required because automated logic tests do not replace real browser inspection at multiple widths.

---

# 13. Frontend Implementation Guardrails

All frontend contributors and AI-assisted coding workflows should preserve the following rules:

1. **Use React Router as the single client-side routing source of truth.**
2. **Use stable content slugs for learner-facing navigation rather than internal numeric database IDs.**
3. **Do not create route-level pages solely because a database table exists.**
4. **Protect authenticated application routes with shared routing guards.**
5. **Route authenticated users away from Login/Register to Dashboard.**
6. **Route authenticated users with `support_language === null` to first-time Language Setup.**
7. **Do not treat frontend route guards as the security authority; Flask remains authoritative.**
8. **Keep main authenticated navigation minimal: Dashboard, Vocabulary, Grammar, Conjugation, language selector, Logout.**
9. **Use one generic normal-Practice route rather than duplicated module-specific Practice routes.**
10. **Do not create a separately reloadable Result route until the API supports detailed result retrieval.**
11. **Keep pages route-oriented and compose them from smaller shared/feature components.**
12. **Use shared components only for UI reused across unrelated features.**
13. **Keep business-feature UI in `features/<feature>/`.**
14. **Use one Auth Context for current learner/session state; do not duplicate support language into a competing global source of truth.**
15. **Keep page-specific server data out of global Context by default.**
16. **Keep current unsaved Practice answers in temporary React state.**
17. **Do not calculate authoritative Practice score, progress, streak, or Mixed Practice eligibility in React.**
18. **Use `apiClient.js` plus feature-specific API modules; do not scatter inconsistent raw fetch logic across components.**
19. **Use relative `/api/v1/...` URLs through the Vite proxy; do not hard-code the Flask origin.**
20. **Render loading, error, empty, and data states explicitly; do not use blank pages as error handling.**
21. **Do not hard-code curriculum Part/Chapter/Lesson/Topic/Study Unit titles into React components.**
22. **Fixed UI text may be localized in frontend VI/EN dictionaries; dynamic learning content comes from the API.**
23. **Use CSS Modules for component/page styles and shared global design tokens for consistent visual language.**
24. **Allow normal vertical page scrolling; do not clip long pages with global fixed-height/hidden-overflow rules.**
25. **Responsive layouts must reflow content rather than scale the full desktop UI down as an image.**
26. **Preserve readability over decorative styling.**
27. **Use the approved visual language (§7) consistently; keep the mascot and decoration secondary to learning content.**
28. **When implementation conflicts with frozen requirements, API behavior, or architecture boundaries, resolve the design conflict before creating a competing frontend behavior.**
29. **Use the EN/VI terminology in §9.4 for fixed UI copy; do not introduce near-synonyms for existing concepts.**
30. **Do not display data the API does not provide; UI that depends on pending API fields is listed in §15 and must not be backed by invented frontend logic.**

---

# 14. Baseline Frontend Summary

The MVP frontend is a React + Vite single-page application using React Router and a clear separation between route-level pages, shared components, feature components, Context, custom hooks, and API modules.

The main application structure is:

```text
Browser
  |
  v
React Router
  |
  +--> Public / Guest Pages
  |
  +--> Auth / Language Guards
          |
          v
       AppLayout
          |
          v
       Route Page
          |
          v
   Feature / Shared Components
          |
          v
     Custom Hook / API Module
          |
          v
       apiClient.js
          |
          v
       /api/v1/...
          |
          v
        Flask
```

State ownership is intentionally narrow:

```text
Global
-> authenticated current user + support language

Page / feature
-> page data + route-specific interactions

Local component
-> UI-only interaction state

Practice hook
-> temporary questions / unsaved answers / current result

Backend
-> authentication truth, persistence, scoring, progress, streak,
   eligibility, ownership, timestamps, and core business rules
```

The UI direction, with the Dashboard as the visual reference:

```text
warm cream page + white rounded cards
+ amber-brown brand primary
+ one accent family per module (Vocabulary blue, Grammar gold, Conjugation orange)
+ dark warm readable text
+ outlined icons in soft tinted tiles
+ croissant mascot as the only illustration
+ Be Vietnam Pro headings
+ Nunito Sans body/UI text
```

The implementation should remain data-driven, readable, responsive, and easy to extend without turning the MVP into a production-scale frontend architecture.

---

# 15. Pending API Dependencies

The approved UI uses the following data that the current API Contract does not yet expose. Until the contract is updated, the frontend shows placeholder/sample values only in the static Dashboard prototype and must not derive these values from invented logic.

| # | UI element | Data needed | Status |
|---|---|---|---|
| 1 | Continue Learning — parent section | `continue_learning.parent` with `title_fr` / `title` (Grammar Chapter, Vocabulary Subtopic, Conjugation Tense) | Pending contract change |
| 2 | Continue Learning — lesson position ("Bài 4/6") | `continue_learning.position` with the unit's 1-based index and the total number of units in that parent | Pending contract change |
| 3 | Greeting `Bienvenue !` | A first-visit signal for the Dashboard | Interim frontend rule in §7.7; an explicit signal needs a contract decision |
