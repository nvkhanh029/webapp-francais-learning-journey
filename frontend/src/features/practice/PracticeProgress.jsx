// Intentionally empty.
//
// The Practice progress bar and the question stepper are rendered together by PracticeHeader, which
// is the component that owns the practice header block (FD §5.4.7). Splitting them here would mean
// passing the answered count and the current index across two components for no gain, so this file
// is kept only to match the FD §5.4.7 file list. Nothing imports it.
export default null;
