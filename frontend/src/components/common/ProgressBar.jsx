// Label row plus progress track (FD §7.6). `percent` is the whole-number value the page already derived
// (the backend stays the source of the learned/total counts, FD §7.7); the bar only displays it.
// The label is named by `ariaLabel` or, when it is visible text with an id, by `labelId`.
// `valueProps` / `trackProps` pass data attributes that page scripts still look for.
export default function ProgressBar({ label, labelId, percent = 0, ariaLabel, valueProps, trackProps }) {
  return (
    <>
      <div className="progress-labels">
        <span id={labelId}>{label}</span> <span className="progress-value" {...valueProps}>{`${percent}%`}</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={labelId ? undefined : ariaLabel}
        aria-labelledby={labelId}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={percent}
        style={{ "--progress": `${percent}%` }}
        {...trackProps}
      >
        <div className="progress-fill" />
      </div>
    </>
  );
}
