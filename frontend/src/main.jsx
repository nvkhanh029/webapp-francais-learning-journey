import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Global styles are imported before the app so they come first in the cascade and page CSS Modules can override them.
import "./styles/tokens.css";
import "./styles/shared.css";
import "./styles/globals.css";
import App from "./app/App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
