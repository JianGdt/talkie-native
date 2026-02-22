import { useEffect, useRef } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import "./global.css";
import { AuthProvider } from "@/context/AuthContext";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { useAuth } from "@/hooks/useAuth";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { initializeWebSocket, cleanup } = useWebSocketStore();

  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const currentUserId = user?.id ?? null;
    if (currentUserId === prevUserIdRef.current) return;

    prevUserIdRef.current = currentUserId;

    if (currentUserId) {
      initializeWebSocket();
    } else {
      cleanup();
    }
  }, [user?.id, isLoading]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments]);

  useEffect(() => {
    return () => cleanup();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
