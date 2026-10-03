import { useCallback, useRef, useState } from "react";

import { startMixedPractice, startNormalPractice, submitPractice } from "../api/practiceApi.js";

// Owns the whole temporary Practice interaction lifecycle (FD §5.6, FD §5.8).
//
// Phases: idle -> loading -> answering -> reviewing -> submitting -> result, plus error. The page
// decides which of its own phases are reachable; this hook reports the lifecycle.
//
// Two contract rules shape the implementation:
//
// 1. **Starting Practice creates no Practice History and reveals no answers** (API §15.1, §16.1). The
//    Start response carries only learner-facing question data and the backend is the sole scorer
//    (API §17.1). Nothing here computes a score or decides correctness.
// 2. **A run is server-side runtime state** (API §18). If Flask restarts, an unfinished run is lost and
//    the learner starts again, which is accepted for the MVP.
//
// StrictMode double-mounts every effect in development. Start is a POST that mints a
// `practice_run_id` on the server, so an unguarded double call would leave an orphaned run behind.
// `start` therefore takes a `token` identifying the run the caller wants; starting twice with the same
// token is ignored. "Practice again" passes a fresh token, which is the only way to begin a second run.
export default function usePractice() {
  const [phase, setPhase] = useState("idle");
  const [run, setRun] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  // The token of the run already started in this session, or null when none has been. A ref, not
  // state: StrictMode's double-invoke happens before a state update from the first pass is flushed,
  // so only a ref reliably prevents the second POST.
  const startedTokenRef = useRef(null);
  // What the last start asked for, so `restart` can begin a new run of the same kind, and a counter that
  // makes each restart's token unique.
  const lastStartRef = useRef(null);
  const restartCountRef = useRef(0);

  const answeredCount = questions.filter((question) => answers[question.question_id] !== undefined).length;
  const unansweredCount = questions.length - answeredCount;
  const canReview = questions.length > 0 && unansweredCount === 0;

  // `mode` is "normal" (with a learning-unit slug) or "mixed". Mixed filters are not implemented: any
  // `filters` key returns 422 invalid_mixed_filters, so the request body stays empty (API §16.2).
  const start = useCallback(async ({ mode, slug, token }) => {
    if (startedTokenRef.current === token) return null;
    startedTokenRef.current = token;
    lastStartRef.current = { mode, slug };
    setPhase("loading");
    setError(null);
    try {
      const payload = mode === "mixed" ? await startMixedPractice({}) : await startNormalPractice(slug);
      setRun(payload);
      setQuestions(payload?.questions ?? []);
      setAnswers({});
      setCurrentIndex(0);
      setResult(null);
      setPhase("answering");
      return payload;
    } catch (cause) {
      setError(cause);
      setPhase("error");
      return null;
    }
  }, []);

  // The learner may change answers freely until final submission (API §17). Answers stay in React
  // state and are never persisted in the browser (FD §5.8).
  const setAnswer = useCallback((questionId, answer) => {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }, []);

  const goTo = useCallback((index) => setCurrentIndex(index), []);
  const nextQuestion = useCallback(
    () => setCurrentIndex((index) => Math.min(index + 1, questions.length - 1)),
    [questions.length],
  );
  const previousQuestion = useCallback(() => setCurrentIndex((index) => Math.max(index - 1, 0)), []);

  const startReview = useCallback(() => setPhase("reviewing"), []);
  const backToAnswering = useCallback(() => setPhase("answering"), []);

  const submit = useCallback(async () => {
    if (!run?.practice_run_id) return null;
    setPhase("submitting");
    setError(null);
    // Exactly one answer entry per run question, in the shape the contract defines for that question
    // type (API §17.1). practiceApi wraps the list into { answers } once. The backend re-validates and
    // rescores everything it receives.
    const answerList = questions.map((question) => ({
      question_id: question.question_id,
      answer: answers[question.question_id],
    }));
    try {
      const submitted = await submitPractice(run.practice_run_id, answerList);
      setResult(submitted);
      setPhase("result");
      return submitted;
    } catch (cause) {
      setError(cause);
      // The answers stay in place so the learner can fix and resubmit (FD §7.12, FD §5.8). A run that
      // is already finalized or gone cannot be resubmitted, so those go to a terminal error phase.
      setPhase(cause?.status === 409 || cause?.status === 404 ? "error" : "reviewing");
      return null;
    }
  }, [answers, questions, run]);

  // "Practice again" and the error "Try again": start a brand-new run of the same kind as the last
  // start, without passing through the idle phase (which renders nothing on the normal Practice page).
  // The fresh token is what lets a second POST through the StrictMode guard in `start`.
  const restart = useCallback(() => {
    const last = lastStartRef.current;
    if (!last) return Promise.resolve(null);
    restartCountRef.current += 1;
    return start({ ...last, token: `${last.mode}:${last.slug ?? ""}:restart-${restartCountRef.current}` });
  }, [start]);

  const reset = useCallback(() => {
    startedTokenRef.current = null;
    setRun(null);
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setError(null);
    setPhase("idle");
  }, []);

  return {
    phase,
    run,
    questions,
    answers,
    currentIndex,
    currentQuestion: questions[currentIndex] ?? null,
    result,
    error,
    isAnswered: (questionId) => answers[questionId] !== undefined,
    answeredCount,
    unansweredCount,
    canReview,
    practiceType: run?.practice_type ?? null,
    // Normal Start returns the learning unit; Mixed Start does not (API §16.1), so this is null there.
    learningUnit: run?.learning_unit ?? null,
    totalQuestions: questions.length,
    start,
    setAnswer,
    goTo,
    nextQuestion,
    previousQuestion,
    startReview,
    backToAnswering,
    submit,
    restart,
    reset,
  };
}
