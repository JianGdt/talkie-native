import React, { createContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import { useWebSocketStore } from "@/store/useWebSocketStore";

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
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string,
    avatarBlob?: Blob,
    avatarUrl?: string,
  ) => Promise<void>;
  updateProfileImage: (avatarBlob: Blob) => Promise<void>;
  updateProfileAvatarUrl: (avatarUrl: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

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
          if (!profile) profile = await createUserProfile(session.user);
          setUser(profile);
        } catch (err) {
          console.error("❌ Error in onAuthStateChange:", err);
        } finally {
          setLoading(false);
          setInitialized(true);
        }
      } else if (
        event === "SIGNED_OUT" ||
        (event === "INITIAL_SESSION" && !session)
      ) {
        setUser(null);
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (data.user) {
        let profile = await fetchUserProfile(data.user.id);
        if (!profile) profile = await createUserProfile(data.user);
        setUser(profile);
      }
    } catch (error) {
      console.error("❌ Email Sign-In error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    avatarBlob?: Blob,
    selectedAvatarUrl?: string,
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;

      if (data.user) {
        let avatarUrl = selectedAvatarUrl;
        if (avatarBlob) {
          try {
            avatarUrl = await uploadAvatar(data.user.id, avatarBlob);
          } catch (avatarError) {
            console.warn("Avatar upload failed during signup:", avatarError);
          }
        }
        const profile = await createUserProfile(data.user, fullName, avatarUrl);
        setUser(profile);
      }
    } catch (error) {
      console.error("❌ Email Sign-Up error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (
    authUser: any,
    fullNameOverride?: string,
    avatarUrl?: string,
  ): Promise<User> => {
    const fullName =
      fullNameOverride ||
      authUser?.user_metadata?.full_name ||
      authUser.email?.split("@")[0] ||
      "User";
    const username =
      authUser.email
        ?.split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") || `user_${Date.now()}`;

    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        user_id: authUser.id,
        username,
        full_name: fullName,
        avatar_url: avatarUrl ?? null,
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

  const uploadAvatar = async (userId: string, avatarBlob: Blob) => {
    const path = `${userId}/${Date.now()}-selfie.jpg`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, avatarBlob, {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    return publicUrl;
  };

  const updateProfileImage = async (avatarBlob: Blob) => {
    if (!user) throw new Error("Not signed in");

    const avatarUrl = await uploadAvatar(user.id, avatarBlob);
    const { error } = await supabase
      .from("user_profiles")
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) throw error;
    setUser({ ...user, profileImage: avatarUrl });
  };

  const updateProfileAvatarUrl = async (avatarUrl: string) => {
    if (!user) throw new Error("Not signed in");

    const { error } = await supabase
      .from("user_profiles")
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) throw error;
    setUser({ ...user, profileImage: avatarUrl });
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
        signInWithEmail,
        signUpWithEmail,
        updateProfileImage,
        updateProfileAvatarUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
