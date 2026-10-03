// Behavior carried over from the raw UI prototype (not-found-page.html). UI preview only.
// Called once per mounted page by usePageScript(); it queries the DOM rendered by NotFoundPage.jsx.
export default function init() {
  // UI prototype only. No routing, session, or API logic is implemented here.
  // React integration: replace with useNavigate(-1) and hide the button when
  // location.key === "default".
  (() => {
      const backButton = document.querySelector('[data-action="go-back"]');
      if (window.history.length <= 1) {
          backButton.hidden = true;
          return;
      }
      backButton.addEventListener("click", () => window.history.back());
  })();

}
