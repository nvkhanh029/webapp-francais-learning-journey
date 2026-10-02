import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import GuestRoute from "./guards/GuestRoute.jsx";
import RequireAuth from "./guards/RequireAuth.jsx";
import RequireLanguage from "./guards/RequireLanguage.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";
import RouteFallback from "../components/common/RouteFallback.jsx";
import ScrollToTop from "../components/navigation/ScrollToTop.jsx";

// Every page is loaded on demand (React.lazy); the layouts show RouteFallback while a page downloads.
const ConjugationLessonPage = lazy(() => import("../pages/ConjugationLessonPage.jsx"));
const ConjugationPage = lazy(() => import("../pages/ConjugationPage.jsx"));
const DashboardPage = lazy(() => import("../pages/DashboardPage.jsx"));
const GrammarLessonPage = lazy(() => import("../pages/GrammarLessonPage.jsx"));
const GrammarPage = lazy(() => import("../pages/GrammarPage.jsx"));
const LandingPage = lazy(() => import("../pages/LandingPage.jsx"));
const LanguageSetupPage = lazy(() => import("../pages/LanguageSetupPage.jsx"));
const LoginPage = lazy(() => import("../pages/LoginPage.jsx"));
const MixedPracticePage = lazy(() => import("../pages/MixedPracticePage.jsx"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));
const PracticePage = lazy(() => import("../pages/PracticePage.jsx"));
const ReferencePage = lazy(() => import("../pages/ReferencePage.jsx"));
const RegisterPage = lazy(() => import("../pages/RegisterPage.jsx"));
const ReviewLaterPage = lazy(() => import("../pages/ReviewLaterPage.jsx"));
const VocabularyPage = lazy(() => import("../pages/VocabularyPage.jsx"));
const VocabularyStudyUnitPage = lazy(() => import("../pages/VocabularyStudyUnitPage.jsx"));
const VocabularyTopicPage = lazy(() => import("../pages/VocabularyTopicPage.jsx"));

// Pages outside the two layouts bring their own Suspense boundary.
function Standalone({ children }) {
  return (
    <Suspense
      fallback={
        <div className="app-page">
          <RouteFallback />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// Route table and guard structure from FD §4.2, §4.3. The guards only act when VITE_AUTH_GUARD is "on".
// Language Setup and the 404 page keep their own header and footer.
export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
        </Route>
        <Route element={<RequireAuth />}>
          <Route
            path="/setup/language"
            element={
              <Standalone>
                <LanguageSetupPage />
              </Standalone>
            }
          />
          <Route element={<RequireLanguage />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/basics/:referenceSlug" element={<ReferencePage />} />
              <Route path="/grammar" element={<GrammarPage />} />
              <Route path="/grammar/lessons/:lessonSlug" element={<GrammarLessonPage />} />
              <Route path="/vocabulary" element={<VocabularyPage />} />
              <Route path="/vocabulary/topics/:topicSlug" element={<VocabularyTopicPage />} />
              <Route path="/vocabulary/study-units/:unitSlug" element={<VocabularyStudyUnitPage />} />
              <Route path="/conjugation" element={<ConjugationPage />} />
              <Route path="/conjugation/lessons/:lessonSlug" element={<ConjugationLessonPage />} />
              <Route path="/practice/:unitSlug" element={<PracticePage />} />
              <Route path="/mixed-practice" element={<MixedPracticePage />} />
              <Route path="/review-later" element={<ReviewLaterPage />} />
            </Route>
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <Standalone>
              <NotFoundPage />
            </Standalone>
          }
        />
      </Routes>
    </>
  );
}
