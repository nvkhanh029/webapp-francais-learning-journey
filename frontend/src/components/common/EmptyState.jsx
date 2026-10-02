// Page-level state for a valid but empty result (FD §6.6). `children` holds optional follow-up links.
export default function EmptyState({
  icon,
  title,
  message,
  headingLevel = 2,
  titleTabIndex,
  hidden = false,
  children,
}) {
  const Heading = `h${headingLevel}`;
  return (
    <div className="card page-state" data-page-state="empty" hidden={hidden}>
      <span className="material-symbols-outlined" aria-hidden="true">
        {icon}
      </span>
      <Heading className="page-state-title" tabIndex={titleTabIndex}>
        {title}
      </Heading>
      <p>{message}</p>
      {children}
    </div>
  );
}
