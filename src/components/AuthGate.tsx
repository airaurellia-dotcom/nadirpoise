import { Navigate, useLocation } from "react-router-dom";
import { useAppState } from "../context/AppContext";
import type { ReactNode } from "react";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  const location = useLocation();

  if (!state.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}