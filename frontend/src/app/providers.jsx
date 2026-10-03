import { AuthProvider } from "../context/AuthContext.jsx";

// Composition of the global providers (FD §5.5). AuthContext is the only global context in the MVP.
export default function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
