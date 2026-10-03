// Practice failures that deserve their own message (API §17.5). The frontend branches on the error
// `code`, never on the English `message`, and returns string-table keys so the text is localized.
// Anything else gets the generic message from the caller.
const SPECIFIC_PRACTICE_ERRORS = {
  incomplete_practice: { titleKey: "practice.incompleteTitle", textKey: "practice.incompleteText" },
  practice_already_submitted: { titleKey: "practice.alreadySubmittedTitle", textKey: "practice.alreadySubmittedText" },
};

export function practiceErrorKeys(error) {
  return (error && SPECIFIC_PRACTICE_ERRORS[error.code]) || null;
}
