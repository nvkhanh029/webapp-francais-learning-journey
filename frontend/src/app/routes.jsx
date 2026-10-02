import { Route, Routes } from "react-router-dom";

import AppLayout from "../layouts/AppLayout.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";
import ScrollToTop from "../components/navigation/ScrollToTop.jsx";
import ConjugationLessonPage from "../pages/ConjugationLessonPage.jsx";
import ConjugationPage from "../pages/ConjugationPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import GrammarLessonPage from "../pages/GrammarLessonPage.jsx";
import GrammarPage from "../pages/GrammarPage.jsx";
import LandingPage from "../pages/LandingPage.jsx";
import LanguageSetupPage from "../pages/LanguageSetupPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import MixedPracticePage from "../pages/MixedPracticePage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import PracticePage from "../pages/PracticePage.jsx";
import ReferencePage from "../pages/ReferencePage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import ReviewLaterPage from "../pages/ReviewLaterPage.jsx";
import VocabularyPage from "../pages/VocabularyPage.jsx";
import VocabularyStudyUnitPage from "../pages/VocabularyStudyUnitPage.jsx";
import VocabularyTopicPage from "../pages/VocabularyTopicPage.jsx";

// Route table from FD §4.2. TODO: wrap the protected group in RequireAuth / RequireLanguage (FD §4.3) once the
// auth context exists. Language Setup and the 404 page keep their own header and footer.
export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route path="/setup/language" element={<LanguageSetupPage />} />
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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
