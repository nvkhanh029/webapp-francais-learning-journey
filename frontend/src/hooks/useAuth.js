import { useContext } from "react";

import { AuthContext } from "../context/AuthContext.jsx";

// Public interface to AuthContext (FD §5.6).
export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
