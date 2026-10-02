// React entry point: mount the SPA into #root and install global routing.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./app/App.jsx";
import "./styles/tokens.css";
import "./styles/globals.css";

// StrictMode adds dev-only checks; BrowserRouter owns client-side routes.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
