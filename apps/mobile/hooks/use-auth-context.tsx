// hooks/use-auth-context.ts
import { AuthContext } from "@/provider/auth-provider";
import { useContext } from "react";

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
