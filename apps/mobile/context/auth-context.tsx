import React, { createContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/services/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔵 AuthProvider mounted");

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("📱 Initial session:", session?.user?.email || "No session");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth event:", event);
      console.log(
        "🔐 Session after event:",
        session?.user?.email || "No session",
      );
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log("🔴 AuthProvider unmounting");
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log("🔓 signOut() called");
    console.log("🔓 Current session before signout:", session?.user?.email);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("❌ Supabase signOut error:", error);
        throw error;
      }

      console.log("✅ supabase.auth.signOut() completed");

      // Manually clear state as backup
      setSession(null);
      setUser(null);
      console.log("✅ State manually cleared");
    } catch (error) {
      console.error("❌ Failed to sign out:", error);
      throw error;
    }
  };

  console.log(
    "🔄 AuthProvider render - session:",
    session?.user?.email || "null",
    "loading:",
    loading,
  );

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
