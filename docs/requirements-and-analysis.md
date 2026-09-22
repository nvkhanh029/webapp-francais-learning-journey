# French Learning Web Application
## Requirements & Analysis Specification

**Document status:** Baseline v1.0  
**Project type:** Web Application Development final project  
**Primary user role:** Learner  
**Target language:** French  
**Support languages:** Vietnamese and English  

---

## 1. Purpose

This document defines the agreed requirements, scope boundaries, user flows, business rules, and non-functional requirements for the French Learning Web Application MVP.

It is intended to serve as the team's shared source of truth during design and implementation. All contributors, including AI-assisted coding workflows, should follow this document unless the team explicitly approves a requirement change.

The project prioritizes a complete, understandable, and demonstrable end-to-end learning experience over a large feature set.

---

## 2. Product Vision

The application is a self-paced French learning platform that allows learners to study selected content freely without prerequisite-based locking.

The primary audience is Vietnamese learners who want a flexible, topic-based way to study, practise, and review French with Vietnamese or English learning support. The MVP is not positioned as a complete CEFR-sequenced A1–C2 course or as an exam-preparation platform.

The core learning areas are:

1. **Grammar**
2. **Vocabulary**
3. **Verb Conjugation**

Each area provides learning content and practice activities. The application also tracks learning progress and the learner's current and longest study streaks.

The main product principle is:

> **Learn freely → Practice → Receive feedback → Track progress → Maintain a learning habit**

---

## 3. MVP Goals

The MVP shall allow a learner to:

- create and access an account;
- choose Vietnamese or English as the support language for learning French during first-time authenticated setup;
- freely browse Grammar, Vocabulary, and Verb Conjugation content;
- study learning content without prerequisite restrictions;
- complete practice quizzes using multiple question formats;
- receive answer feedback after submitting a completed practice session;
- review basic practice-history summaries to observe performance over time;
- track completed learning content;
- track current and longest learning streaks;
- complete mixed practice using previously learned content;
- optionally flag difficult content for later review;
- access a lightweight French Alphabet & Accents reference.

---

## 4. User Roles

### 4.1 Learner — MVP Role

The MVP contains one application role only: **Learner**.

A learner can:

- register;
- log in and log out;
- choose a support language during first-time authenticated setup;
- browse learning modules;
- study learning content;
- complete practice quizzes;
- view basic practice-history summaries;
- mark content as learned;
- view progress;
- track current and longest learning streaks;
- use Mixed Practice;
- save difficult content for later review;
- access the French Alphabet & Accents reference.

### 4.2 Future Roles — Out of MVP Scope

The following roles are not part of the MVP:

- Teacher
- Administrator

Possible future responsibilities include content management, user management, classroom management, assignment creation, and learner analytics.

---

## 5. Functional Requirements

### 5.1 Authentication

**FR-AUTH-01 — Register**  
The system shall allow a new learner to register using an email address and password. Email input shall be trimmed and normalized to lowercase for storage and uniqueness comparison. The normalized value shall use a valid basic email format and shall not be empty. Each normalized email address shall identify at most one learner account; an attempted duplicate registration shall be rejected with a clear error message. The registration password shall contain at least 8 characters. Additional password-complexity rules are not required for the MVP.

**FR-AUTH-02 — Automatic sign-in after registration**  
After successful registration, the learner shall enter the authenticated application directly without being required to log in again.

**FR-AUTH-03 — Login**  
The system shall allow an existing learner to log in using valid credentials.

**FR-AUTH-04 — Logout**  
The system shall allow an authenticated learner to log out.

**FR-AUTH-05 — Protected learner data**  
Progress, Practice History, streak, language preference, Review Later state, and Continue Learning state shall be associated with the authenticated learner.

---

### 5.2 Language Preference

**FR-LANG-01 — Public interface language**  
The public area of the MVP, including the Landing, Login, and Register pages, shall use Vietnamese by default because the application primarily targets Vietnamese learners. A public language selector is not required for the MVP.

**FR-LANG-02 — First-time authenticated language setup**  
After successful authentication, if the learner has not yet selected a support language, the application shall ask the learner to choose one of the following:

- Vietnamese (`vi`)
- English (`en`)

For a newly registered learner, this setup occurs after automatic sign-in and before entering the Dashboard.

**FR-LANG-03 — French remains the target language**  
Changing the support language shall not change the language being learned. French remains the target language in all learning modules.

**FR-LANG-04 — Language-sensitive content**  
The selected support language shall be used for applicable content, including:

- interface labels;
- instructions;
- grammar explanations;
- vocabulary meanings;
- conjugation explanations;
- French Basics / reference explanations;
- example translations, where provided;
- quiz prompts that depend on translation or explanation.

**FR-LANG-05 — Persist language preference**  
The learner's selected support language shall be stored and automatically restored after future logins.

**FR-LANG-06 — Change language**  
An authenticated learner shall be able to switch between Vietnamese and English without losing progress, Practice History, streak, quiz availability, Review Later state, or Continue Learning state.

**FR-LANG-07 — Unset-language fallback**  
If an authenticated request reaches language-sensitive application content while the learner's persisted `support_language` is still unset, the system shall use Vietnamese (`vi`) as the temporary response-language fallback. This fallback shall not automatically persist `vi`; the learner's preference remains unset until the learner explicitly completes language setup or changes the preference. The normal frontend flow shall still route a learner with no saved preference to first-time language setup before the Dashboard.

---

## 6. Learning Modules

### 6.1 Grammar

Grammar content shall be organized into lessons based on the chapter/topic structure of a selected grammar reference book.

The MVP does not require all book content to be entered. The system shall be designed so additional lessons can be added later without restructuring the application.

A Grammar lesson should contain:

- lesson title;
- theory/explanation;
- examples;
- optional support-language translations where appropriate;
- a control to mark the lesson as learned;
- access to lesson-specific practice.

**Grammar progress unit:** one Grammar lesson.

---

### 6.2 Vocabulary

Vocabulary shall be structured to prevent information overload.

The content hierarchy shall be:

```text
Vocabulary
└── Category
    └── Topic
        └── Subtopic
            └── Study Unit
                └── Vocabulary Entries
```

* A **Category** represents a broad vocabulary domain.
* A **Topic** represents a major topic within a Category.
* A **Subtopic** represents a more specific vocabulary area within a Topic.
* A **Study Unit** represents the manageable portion of vocabulary that the learner studies and completes.
* A **Vocabulary Entry** may be a single French word or a multi-word expression.

A Subtopic may contain one or more Study Units depending on the amount of vocabulary content available.

Study Units should remain reasonably small to reduce information overload. Approximately **10–15 vocabulary entries per Study Unit** is a practical target for the MVP, but this is a guideline rather than a strict limit.

Example:

```text
La nourriture et la restauration
└── L'alimentation (1)
    └── Le pain et les viennoiseries
        ├── Study Unit 1
        ├── Study Unit 2
        └── Study Unit 3
```

A Vocabulary Study Unit should display:

- French word or expression;
- Vietnamese meaning;
- English meaning;
- optional IPA transcription;
- optional example sentence;
- optional translated example;
- a control to mark the Study Unit as learned;
- access to Study Unit practice.

Only the learner's selected support-language meaning needs to be shown by default.

IPA is optional for the MVP. Where provided, it should use standard IPA notation rather than ad-hoc Vietnamese-style phonetic spelling.

**Vocabulary progress unit:** one Study Unit.

---

### 6.3 Verb Conjugation

Verb Conjugation shall teach **rules and patterns**, not treat each individual verb as a separate learning lesson.

The learning hierarchy shall follow the general pattern:

```text
Verb Conjugation
└── Tense
    └── Rule / Pattern Lesson
        ├── Rule
        ├── Conjugation pattern
        ├── Example verbs
        └── Practice
```

Example:

```text
Présent
├── Regular -ER verbs
├── Regular -IR verbs
├── Regular -RE verbs
└── Common irregular patterns
```

A Conjugation lesson should contain:

- tense and pattern title;
- formation rule;
- conjugation pattern/table;
- example verbs;
- example sentences;
- support-language explanation;
- a control to mark the lesson as learned;
- access to lesson-specific practice.

**Conjugation progress unit:** one tense/rule-pattern lesson.

#### Verb Reference — Secondary Feature

A searchable individual verb reference may be added if time permits.

Possible flow:

```text
Search / Browse verb
→ Individual verb
→ Conjugation table by tense
```

This reference feature is not a progress unit and should not replace the rule/pattern-based learning structure.

### 6.4 French Basics Reference

The MVP shall provide a lightweight **French Alphabet & Accents** reference for learners who need foundational pronunciation and orthography support.

This content is a reference feature rather than a fourth core learning module and shall not be classified as Grammar.

The reference may include:

- the French alphabet;
- letter names and basic pronunciation guidance;
- common accented characters and diacritics;
- short usage or pronunciation notes where useful.

The Alphabet & Accents reference is not a progress unit. The MVP does not require **Mark as Learned**, lesson-specific practice, or quiz completion for this reference page.

---

## 7. Learning Flow

The application shall support free, non-linear learning.

### 7.1 Main Flow

```text
Dashboard
   ├── Continue Learning
   └── Explore Learning
          ├── Grammar
          ├── Vocabulary
          └── Verb Conjugation
                 ↓
          Choose learning unit
                 ↓
          View learning content
                 ↓
          Mark as Learned and/or Practice
```

### 7.2 No Prerequisite Locking

The learner shall not be required to complete one lesson before opening another lesson.

The system shall not use:

- locked lessons;
- minimum scores to unlock content;
- pass/fail progression gates.

---

## 8. Practice and Quiz Requirements

### 8.1 Supported Question Types

The MVP shall support the following practice formats:

1. **Multiple Choice**  
   Select the correct French answer or form.

2. **Fill in the Blank**  
   Enter a French answer based on context, Vietnamese meaning, or English meaning.

3. **Sentence Ordering**  
   Arrange words or sentence components into the correct order.

### 8.2 Practice Flow

```text
Start Practice
      ↓
Answer Questions
      ↓
Review / Change Answers
      ↓
Submit Practice
      ↓
Practice Result
      ↓
Answer Feedback / Correct Answers
      ↓
Retry Practice / Return
```

### 8.3 Quiz Rules

- Practice is optional and is not required to mark a learning unit as learned.
- A normal practice session is considered completed when the learner has answered every question, submits the completed practice, and reaches the Practice Result state.
- Leaving or abandoning a practice session before reaching the result state shall not create Practice History or streak activity.
- Completing a normal practice session counts as valid learning activity for streak purposes.
- No minimum quiz score is required for a completed practice session to count toward the streak.
- Each question contributes one result point. Session accuracy is derived from the number of questions answered correctly divided by the total number of questions.
- Before final submission, the learner may review and change answers freely. The answer present at the time the completed practice is submitted determines that question's contribution to the session result.
- For Fill in the Blank, answer matching should ignore leading/trailing whitespace and letter case. French spelling, accents, and apostrophes remain significant unless an alternative form is explicitly configured as an accepted answer.
- For Sentence Ordering, the learner-facing pieces shall start in an order different from the correct answer sequence. The system shall shuffle the pieces before presenting the question and must not present the canonical correct sequence as the initial arrangement.
- A quiz score shall not lock or unlock learning content.
- The system shall not display a formal pass/fail result.
- After viewing the result, the learner may retry the whole practice multiple times as a new practice session.
- The Practice Result should clearly indicate whether each submitted answer is correct.
- Correct answers and any configured explanations should be available on the Practice Result after final submission.

### 8.4 Basic Practice History

The MVP shall store a lightweight summary for each completed normal Practice or Mixed Practice session so that the learner can observe performance over time.

A stored practice-history summary should include:

- practice type (`normal` or `mixed`);
- a reference to the related learning unit when applicable;
- completion date/time;
- number of correct answers;
- total number of questions;
- accuracy or score derived from the result.

The system shall retain the summary for every completed practice session required by the MVP. The Dashboard shall expose a recent subset of those summaries, ordered from most recent to oldest. A separate full-history archive page is not required for the MVP. Repeated attempts can be compared when they appear within the displayed Recent Practice entries.

For normal Practice, the interface shall display a human-readable content label (such as the module, learning-unit title, and relevant breadcrumb) rather than an internal learning-unit identifier. The learner should be able to use this label to navigate back to the related learning content.

For Mixed Practice, no single learning unit is associated with the history entry; it shall be displayed as Mixed Practice.

On the Dashboard, the user-facing **Type** value shall represent the content source of the practice entry:

- `Grammar`
- `Vocabulary`
- `Conjugation`
- `Mixed`

For normal Practice, the Type value is derived from the related learning unit. It is a display classification and does not create a separate progress category.

The MVP does **not** require full per-question answer history, answer snapshots, detailed item-level analytics, or advanced performance charts.

---

## 9. Mixed Practice

The application shall provide a **Mixed Practice** mode from the authenticated learning area.

### 9.1 Question Source

Mixed Practice shall draw questions from learning units the learner has already marked as learned.

It shall not randomly introduce unseen learning units by default.

### 9.2 Session Composition

A Mixed Practice session shall use a target size of **10 questions** for the MVP.

Selection rules:

- eligible questions come only from learning units the learner has already marked as learned;
- when at least 10 eligible distinct questions exist, select 10 distinct questions randomly without replacement;
- when fewer than 10 eligible distinct questions exist, use all available eligible distinct questions;
- never repeat questions merely to reach 10 and never introduce questions from ineligible or unseen learning units;
- no fixed quota or guaranteed distribution by Grammar, Vocabulary, Conjugation, or question type is required; the resulting session composition depends on the eligible pool and random selection;
- provide the same final-submission and Practice Result feedback behavior as normal practice.

At the Mixed Practice Result state, the interface shall show a **Content Covered** summary listing the distinct learning units represented in that session. The summary shall use human-readable lesson or Study Unit labels rather than internal identifiers and may group them by module where helpful.

This Content Covered requirement applies to the current Mixed Practice Result view. The MVP does **not** require the complete composition of each Mixed Practice session to be persisted in Basic Practice History.

### 9.3 Mixed Practice Rules

- Completing all questions in a Mixed Practice session and reaching the result state counts as valid learning activity for streak purposes.
- No minimum score is required for a completed Mixed Practice session to count toward the streak.
- Mixed Practice shall not directly increase module completion progress.
- If no learning unit has been marked as learned, the application shall explain that Mixed Practice is not yet available.

### 9.4 Optional Mixed Practice Filters — Should Have

After the core Mixed Practice flow is stable, the application may allow the learner to narrow the eligible Mixed Practice pool before starting a session.

Supported filters should remain simple:

**Content sources**
- Grammar
- Vocabulary
- Conjugation

**Question types**
- Multiple Choice
- Fill in the Blank
- Sentence Ordering

Filter rules:

- filters shall only narrow content that has already been marked as learned;
- at least one content source and one question type must remain selected;
- if the selected filters produce no eligible questions, the interface should explain the issue and ask the learner to adjust the filters;
- if the filtered pool contains fewer questions than the normal target session size, the application may use the available eligible questions rather than silently introducing excluded content;
- selecting individual lessons or learning units for a custom mixed session is outside the MVP scope.

These filters are a **Should Have** enhancement and are not required for MVP acceptance.

---

## 10. Progress Tracking

Progress shall represent learning content explicitly marked as learned.

Opening a lesson alone shall not automatically count as completion.

### 10.1 Completion Action

A learning unit shall be considered completed only after the learner explicitly performs the equivalent of:

```text
Mark as Learned
```

Repeating the action on an already completed unit shall not increase progress again.

Marking or unmarking a learning unit as learned affects module progress only.

The **Mark as Learned** action does not count as valid learning activity for streak purposes.

If the learner reverses the completion state, the learning unit shall no longer count toward module progress. This action does not add or remove streak activity.

### 10.2 Progress Units

| Module | Progress Unit |
|---|---|
| Grammar | One Grammar lesson |
| Vocabulary | One Vocabulary Study Unit |
| Verb Conjugation | One tense/rule-pattern lesson |

### 10.3 Progress Display

The Dashboard should display progress for each major module, for example:

```text
Grammar          4 / 20
Vocabulary       6 / 24 Study Units
Conjugation      3 / 12 lessons
```

The exact visual representation may use counts, percentages, or progress bars.

---

## 11. Learning Streak

The MVP shall track the learner's **current streak** and **longest streak**.

### 11.1 Valid Learning Activity

A calendar day counts as an active learning day when the learner completes at least one of the following:

- completes a normal practice session;
- completes a Mixed Practice session.

A practice session counts as completed only after the learner has answered every question, submits the completed practice, and reaches the corresponding result state.

No minimum practice score is required for streak purposes.

The following shall not count by themselves:

- opening the website;
- logging in;
- opening a learning unit;
- marking or unmarking a learning unit as learned;
- adding or removing a learning unit from Review Later.

The interface should clearly communicate which activities count toward maintaining a learning streak.

### 11.2 Streak Rules

- Multiple valid activities on the same calendar day count as one active day.
- If the learner is active today, the current streak is the consecutive run of active days ending today.
- If the learner has not yet been active today but was active yesterday, the current streak remains the consecutive run ending yesterday and can still be maintained by completing practice today.
- If the learner was active neither today nor yesterday, the current streak is `0` until a new valid learning day is recorded.
- For the local MVP, streak day boundaries use the backend application's local calendar date. A user-configurable timezone is outside scope.

### 11.3 Longest Streak

The system shall track the learner's **longest streak** in addition to the current streak.

Rules:

- `longest_streak` represents the highest current streak the learner has achieved;
- when `current_streak` exceeds `longest_streak`, the longest streak is updated;
- missing one or more calendar days resets only the current streak when learning resumes;
- the longest streak is preserved unless the user account is reset or deleted.

### 11.4 Learning Activity Calendar

A GitHub-style **Learning Activity Calendar** is a **Should Have** feature.

If implemented:

- it shall visualize recent active learning days using the same completed-practice activity definition used by the streak;
- daily intensity may represent the number of completed Practice and Mixed Practice sessions on that date;
- it should show a manageable recent period (for example, several recent weeks) rather than requiring a full one-year view;
- it shall be informational only and shall not independently change progress or streak values.

---

## 12. Review Later

A learner may optionally mark difficult content for later review.

Review state shall be independent of completion state.

A learning unit may therefore be both:

```text
Learned = true
Review Later = true
```

Review Later shall not decrease or increase module progress.

Recommended review granularity:

- Grammar → lesson;
- Vocabulary → Study Unit;
- Conjugation → rule/pattern lesson.

Saving individual words or individual verbs is outside the MVP scope.

### Priority

Review Later is a **Must Have** feature for the MVP.

A dedicated Review Practice mode is a **Should Have** feature and should be implemented only after the core learning flows are stable.

---

## 13. Continue Learning

The Dashboard shall provide a **Continue Learning** entry point.

Recommended behavior:

- show the most recently opened learning unit that has not yet been marked as learned;
- if there is no unfinished recent unit, encourage the learner to explore another lesson.

The MVP does not require recommendation algorithms or personalized lesson ranking.

---

## 14. Information Architecture / Page Scope

### 14.1 Public Area

The public area shall use Vietnamese by default for the MVP.

```text
Landing Page
Login
Register
```

A public VI/EN language selector is not required.

### 14.2 Authenticated Area

```text
First-time Language Setup (only when no preference has been saved)
        ↓
Dashboard
├── French Basics
│   └── Alphabet & Accents
│
├── Grammar
│   └── Grammar Lesson
│       └── Practice
│           └── Result
│
├── Vocabulary
│   └── Category
│       └── Topic
│           └── Subtopic
│               └── Study Unit
│                   └── Practice
│                       └── Result
│
├── Verb Conjugation
│   └── Tense
│       └── Rule / Pattern Lesson
│           └── Practice
│               └── Result
│
└── Mixed Practice
    └── Result
```

Secondary MVP view:

```text
Review Later list / filtered view
```

Optional / Should Have page:

```text
Verb Reference
```

### 14.3 Main Navigation

Authenticated navigation should remain minimal:

```text
Home
Grammar
Vocabulary
Conjugation
Language selector
Logout
```

A separate Progress page is not required for the MVP if the Dashboard presents progress clearly.

French Basics may be reached from the Dashboard or contextual links and does not require a permanent main-navigation item.

Basic Practice History shall be presented directly on the Dashboard rather than requiring a separate Practice History page for the MVP.

---

## 15. Dashboard Requirements

The Dashboard is the primary authenticated home screen.

It should present:

- a short French greeting or welcome state (e.g., `Bienvenue !` for first-time learners and `Bonjour !` for returning learners), while supporting guidance and interface text continue to follow the learner's selected support language (VI/EN);
- current streak;
- longest streak;
- clear guidance that completing a normal Practice or Mixed Practice session maintains the streak;
- module progress;
- Continue Learning;
- entry points to Grammar, Vocabulary, and Verb Conjugation;
- access to the French Alphabet & Accents reference;
- Mixed Practice;
- a Recent Practice section displaying basic Practice History directly on the Dashboard;
- access to Review Later content;
- the Learning Activity Calendar, if that Should Have feature is implemented.

The Recent Practice section should display a limited number of the learner's most recent completed practice sessions, for example the latest 5–10 entries.

Each entry should show:

- **Type**: `Grammar`, `Vocabulary`, `Conjugation`, or `Mixed`;
- **Content**: a human-readable learning-unit label for normal Practice, or `Mixed Practice` for Mixed Practice;
- **Result**: correct answers / total questions and accuracy;
- **Date**: completion date/time.

For normal Practice, the learning-unit label should be clickable and navigate back to the related learning content.

Mixed Practice entries shall be labelled as Mixed Practice and do not require a learning-unit link.

Example information structure:

```text
Current Streak / Longest Streak

Continue Learning
→ Recently opened unfinished content

Your Progress
Grammar
Vocabulary
Conjugation

Explore
[ French Alphabet & Accents ]
[ Grammar ] [ Vocabulary ] [ Conjugation ]

Recent Practice
Type | Content | Result | Date
...

[ Mixed Practice ]
```

---

## 16. Business Rules Summary

### BR-01 — Free learning
All learning units are accessible without prerequisite unlocking.

### BR-02 — Explicit completion
A learning unit is completed only when the learner explicitly marks it as learned.

### BR-03 — Practice is not assessment
Quiz scores do not control progress, access, or unlocking.

### BR-04 — Module-specific progress units
Grammar, Vocabulary, and Conjugation use the progress units defined in Section 10.

### BR-05 — Mixed Practice source
Mixed Practice uses already learned content by default.

### BR-06 — Review state is independent
Review Later is independent of completion state.

### BR-07 — Streak requires completed practice activity
A learning day is recorded only when the learner completes a normal practice session or a Mixed Practice session.

Marking content as learned, changing Review Later state, logging in, or viewing content alone does not count toward the streak.

### BR-08 — Support language does not create separate progress
Switching between Vietnamese and English does not reset or duplicate learning state.

### BR-09 — French is always the target language
Vietnamese and English are support languages only.

### BR-10 — Completed practice creates a history summary
Each completed normal Practice or Mixed Practice session shall create one lightweight practice-history summary. Full per-question answer history is not required.

### BR-11 — French Basics is reference content
The French Alphabet & Accents page is foundational reference content and does not contribute to module progress.

### BR-12 — Activity Calendar uses the same activity source as streak
If the Learning Activity Calendar is implemented, it shall be derived from completed Practice and Mixed Practice activity and shall not define a separate type of learning activity.

---

## 17. Non-Functional Requirements

### 17.1 Usability

- The interface shall be simple and consistent.
- Learners shall be able to identify the three learning modules easily.
- Large content collections shall be broken into manageable levels rather than displayed as one long list.
- Practice feedback shall be understandable and visible after submission.
- Progress and streak information shall be easy to find.

### 17.2 Responsive Design

The application shall remain usable on common:

- desktop/laptop screens;
- tablets;
- mobile screens.

Desktop/laptop is the primary target for the final project.

A separate native mobile interface is not required.

### 17.3 Performance

Common interactions should respond without noticeable delay under normal project usage conditions.

The application should avoid loading very large Vocabulary or Verb collections into a single screen unnecessarily.

No strict production-grade latency benchmark is required for the MVP.

### 17.4 Security

At minimum:

- passwords shall not be stored in plain text;
- passwords shall be securely hashed by the backend;
- protected learner data shall require authentication;
- backend endpoints shall validate incoming data;
- one learner shall not be able to update another learner's progress or account data.

The following are outside MVP scope:

- OAuth/social login;
- multi-factor authentication;
- email verification;
- advanced security monitoring.

### 17.5 Reliability and Error Handling

The application shall handle common errors without crashing the interface.

Examples include:

- invalid login credentials;
- failed content requests;
- invalid quiz submissions;
- unavailable API responses.

Errors shown to learners should be understandable and should provide a reasonable recovery path where possible.

Repeated completion or review actions shall not create duplicate progress records.

### 17.6 Maintainability

The implementation should use a modular structure so that:

- learning modules can be extended;
- new content can be added without rewriting unrelated UI;
- quiz types can reuse shared components and logic;
- learning data remains separate from presentation code;
- common business rules are not duplicated unnecessarily.

This requirement is especially important because multiple team members may develop features in parallel.

### 17.7 Browser Compatibility

The MVP should support current versions of major modern browsers, including:

- Chrome;
- Edge;
- Firefox;
- Safari.

Legacy browser support is not required.

### 17.8 Basic Accessibility

The MVP should follow basic accessible-interface practices, including:

- visible form labels;
- meaningful buttons and links;
- semantic HTML where practical;
- keyboard-accessible primary interactions;
- status information that does not rely on color alone.

Full formal accessibility certification is not an MVP requirement.

### 17.9 Language Preference Persistence

Changing or restoring support language shall not reset:

- progress;
- Practice History;
- streak;
- Review Later state;
- Continue Learning state;
- content access.

---

## 18. Scope Priorities

The team shall use the following priority levels to control scope.

### 18.1 MUST HAVE — Core MVP

1. Register / Login / Logout
2. Vietnamese / English support-language preference
3. Grammar learning flow
4. Vocabulary Category → Topic → Subtopic → Study Unit learning flow
5. Verb Conjugation tense → rule/pattern learning flow
6. Three supported quiz types
7. Quiz result feedback after final submission
8. Progress tracking
9. Current streak
10. Mixed Practice
11. Review Later
12. Continue Learning
13. Longest streak
14. Basic Practice History
15. French Alphabet & Accents reference

The project should not add optional features at the expense of making these flows stable and demonstrable.

### 18.2 SHOULD HAVE

Implement only after the core flow is working:

- dedicated Review Practice;
- searchable Verb Reference;
- Learning Activity Calendar;
- simple Mixed Practice filters by content source and question type;
- optional IPA transcription for vocabulary entries;
- enhanced or dedicated answer-review UI beyond the immediate per-question feedback already required on the Practice Result.

### 18.3 STRETCH FEATURES

Implement only if the MVP is complete, integrated, and tested:

- advanced practice-history charts or trend analytics;
- advanced search/filtering;
- saved individual vocabulary words;
- saved individual verbs.

### 18.4 FUTURE / POST-MVP IDEAS

These ideas may guide later development but shall not change the current implementation plan:

- **Adaptive Mixed Practice** that prioritizes learning units or question types where the learner has shown weaker performance;
- more granular performance tracking to support reliable weak-area detection;
- richer personalized practice recommendations based on retained performance data.

The current Basic Practice History stores session-level summaries only, so robust adaptive practice would require additional performance data and design work beyond the MVP.

---

## 19. Explicitly Out of Scope

The following are excluded from the MVP:

- Teacher role
- Admin dashboard
- Classroom management
- Course enrollment workflow
- Assignment system
- Lesson prerequisites / locked progression
- Social login
- Email verification
- Forgot-password email flow
- Leaderboards
- Friend/social features
- Certificates
- AI tutor/chatbot
- Personalized recommendation algorithms, including adaptive weak-area Mixed Practice
- Speech recognition
- Pronunciation scoring
- Full learner analytics
- Full per-question quiz-attempt history and detailed answer analytics
- Formal CEFR A1–C2 curriculum sequencing or comprehensive CEFR mapping
- Exam-specific preparation workflows (for example DELF, DALF, or TCF)
- Offline/PWA support
- Native mobile applications
- User-generated lessons
- Advanced gamification beyond the streak tracking defined for the MVP
- Public deployment / cloud hosting
- Managed cloud database services

---

## 20. Assumptions

The MVP assumes that:

- one account represents one learner;
- French is the only target language;
- Vietnamese and English are the only support languages for the authenticated learning experience;
- the public Landing, Login, and Register pages use Vietnamese by default;
- the learner uses a modern web browser;
- the MVP is run and demonstrated in a local development environment;
- learning content is prepared by the project team;
- learners do not create or edit learning content;
- learners may revisit any content and practice any number of times;
- content does not need to be completed in a fixed sequence;
- quiz activities are practice rather than formal assessment;
- the MVP is topic-based and does not claim comprehensive CEFR-level coverage or exam-preparation coverage.

---

## 21. Project Constraints

### 21.1 Development Time

Given the limited development timeframe, the project prioritizes a stable and complete core learning flow over additional non-essential features.

### 21.2 Team Constraint

Multiple members may develop separate features in parallel, potentially with AI-assisted coding.

To reduce integration risk:

- all members shall follow this shared scope;
- feature behavior shall not be redefined independently by individual contributors;
- reusable components and shared data contracts should be preferred;
- changes to core business rules should be agreed before implementation.

### 21.3 Content Constraint

The system should be designed to support more content later, but the demo does not require a full production-sized curriculum.

The MVP only needs enough representative content to demonstrate:

- all three learning modules;
- all required question types;
- progress tracking;
- streak behavior;
- basic Practice History;
- the French Alphabet & Accents reference;
- Mixed Practice;
- both support languages.

---

## 22. Technical Direction

The agreed technical direction is:

```text
Frontend
React + Vite
HTML / CSS / JavaScript

Backend
Python + Flask

Client–Server Communication
REST-style HTTP API + JSON

Database
SQLite
Local file-based relational database

Deployment
Local development and local demonstration only
No public/cloud deployment is required for the MVP

Version Control
Git + GitHub
```

### Rationale

- React + Vite supports component-based client-side development and reusable UI.
- Flask keeps the backend relatively small and explicit for the project scope.
- REST/JSON provides a clear contract between frontend and backend.
- The project data is strongly relational, making a relational database suitable.
- SQLite is appropriate for the expected MVP workload, requires no separate database server, and minimizes setup and integration overhead within the limited development timeframe.
- Keeping the application local removes public-hosting and managed-database work from the MVP so the team can prioritize the core learning flows, integration, and testing.

The team should avoid adding infrastructure that does not directly support the MVP, such as cloud hosting, managed databases, microservices, Redis, distributed systems, or advanced database features.

---

## 23. MVP User Flow

### First Visit

```text
Open Website
      ↓
Landing Page (Vietnamese)
      ↓
Register / Login (Vietnamese)
      ↓
Authentication successful
      ↓
First-time Language Setup
   VI / EN
      ↓
Save preference
      ↓
Dashboard
```

### Returning Learner

```text
Login
  ↓
Load saved language preference
  ↓
Dashboard
  ├── Continue Learning
  ├── Explore Learning
  └── Mixed Practice
```

### Normal Learning

```text
Choose Module
      ↓
Choose Learning Unit
      ↓
View Content
      ↓
Mark as Learned (optional timing decided by learner)
      ↓
Practice (optional)
      ↓
Submit completed practice
      ↓
Result + answer feedback
      ↓
Practice summary saved to history
      ↓
Continue Learning / Dashboard
```

### Mixed Practice

```text
Dashboard
   ↓
Mixed Practice
   ↓
Random questions from learned units
   ↓
Submit completed practice
   ↓
Result + answer feedback
   ↓
Practice summary saved to history
   ↓
Retry / Dashboard / Continue Learning
```

---

## 24. MVP Acceptance Summary

The MVP can be considered functionally complete when a learner can successfully perform the following end-to-end scenario:

1. Open the application and view the Vietnamese public Landing page.
2. Register and enter the authenticated application automatically.
3. Choose Vietnamese or English as the support language during first-time setup.
4. Enter the Dashboard using the selected support language.
5. Browse Grammar, Vocabulary, and Verb Conjugation.
6. Access the French Alphabet & Accents reference.
7. Open and study representative content from each core learning module.
8. Mark learning units as learned.
9. Complete all three supported question types.
10. Submit completed practice and receive answer feedback on the Practice Result.
11. View saved basic Practice History after completing practice sessions.
12. View updated module progress together with current and longest streak information.
13. Use Continue Learning to return to the most recently opened unfinished learning unit.
14. Mark a learning unit for Review Later and confirm that review state remains independent of completion state.
15. Generate and complete a Mixed Practice session from learned content and view the Content Covered summary on the result screen.
16. Complete normal Practice or Mixed Practice sessions on different days and observe current and longest streak behavior.
17. Log out and log back in without losing the saved support language, progress, streak, practice history, or review state.

If these flows are stable, the team should prioritize testing, integration, demo readiness, and technical understanding before adding stretch features.

---

## 25. Change Control

Because the development timeframe is limited, uncontrolled requirement growth is a significant delivery risk.

Before adding a new feature, the team should ask:

1. Does it directly support the core French-learning flow?
2. Does it introduce significant new UI, API, database, or business logic?
3. Would the final demo be materially worse without it?

If the answer to Question 3 is **no**, the feature should normally be moved to the Should Have, Stretch, or Future scope rather than added immediately.

### 25.1 Requirements Freeze

After this final requirements review, the **Must Have scope is frozen** for implementation.

The Must Have scope should be reopened only when one of the following applies:

- an existing requirement is contradictory or technically impossible as written;
- an implementation-blocking behavior is genuinely undefined and requires clarification;
- a defect is discovered that prevents an agreed Must Have flow from working correctly;
- the instructor explicitly requires a change.

New product ideas discovered during development shall be recorded as Should Have, Stretch, or Future items and shall not change the current Must Have implementation plan unless the team explicitly reopens scope under one of the conditions above.
