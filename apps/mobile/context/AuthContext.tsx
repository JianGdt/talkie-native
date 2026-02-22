import React, { createContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { Platform } from "react-native";

import * as Linking from "expo-linking";
import { useWebSocketStore } from "@/store/useWebSocketStore";

WebBrowser.maybeCompleteAuthSession();

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false); // add this

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    redirectUri: makeRedirectUri({ scheme: "mobilefe" }),
  });

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSignIn(response.authentication?.idToken);
    }
  }, [response]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth event:", event, session?.user?.id);

      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session?.user
      ) {
        try {
          let profile = await fetchUserProfile(session.user.id);
          if (!profile) profile = await createGoogleUserProfile(session.user);
          setUser(profile);
        } catch (err) {
          console.error("❌ Error in onAuthStateChange:", err);
        } finally {
          setLoading(false);
          setInitialized(true); // mark as done
        }
      } else if (
        event === "SIGNED_OUT" ||
        (event === "INITIAL_SESSION" && !session)
      ) {
        setUser(null);
        setLoading(false);
        setInitialized(true); // mark as done even with no session
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // useEffect(() => {
  //   checkSession();
  // }, []);

  // const checkSession = async () => {
  //   setLoading(true);
  //   try {
  //     const {
  //       data: { session },
  //     } = await supabase.auth.getSession();
  //     if (session?.user) {
  //       const profile = await fetchUserProfile(session.user.id);
  //       setUser(profile);
  //     } else {
  //       setUser(null);
  //     }
  //   } catch (error) {
  //     console.error("Error checking session:", error);
  //     setUser(null);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const signOut = async () => {
    try {
      useWebSocketStore.getState().cleanup();

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error("❌ Failed to sign out:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === "web") {
        const redirectTo = window.location.origin;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        if (error) throw error;
      } else {
        await promptAsync();
      }
    } catch (error) {
      console.error("❌ Google Sign-In error:", error);
      throw error;
    }
  };
  const handleGoogleSignIn = async (idToken: string | undefined) => {
    if (!idToken) {
      console.error("❌ No ID token received");
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });
      if (error) throw error;

      if (data.user) {
        let profile = await fetchUserProfile(data.user.id);
        if (!profile) profile = await createGoogleUserProfile(data.user);
        setUser(profile);
        console.log("✅ Google Sign-In successful:", profile);
      }
    } catch (error) {
      console.error("❌ Failed to complete Google sign-in:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createGoogleUserProfile = async (authUser: any): Promise<User> => {
    const fullName =
      authUser?.full_name || authUser.email?.split("@")[0] || "User";
    const username =
      authUser.email
        ?.split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") || `user_${Date.now()}`;
    const avatarUrl = authUser?.avatar_url || authUser?.user?.username;

    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        user_id: authUser.id,
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.user_id,
      name: data.full_name,
      username: data.username,
      email: authUser.email || "",
      profileImage: data.avatar_url,
    };
  };

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) return null;

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return null;

      return {
        id: data.user_id,
        name: data.full_name,
        username: data.username,
        email: authData.user.email || "",
        profileImage: data.avatar_url,
      };
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || !initialized,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
