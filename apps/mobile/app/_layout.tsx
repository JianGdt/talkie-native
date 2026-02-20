import { useEffect } from "react";
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
  const { initializeWebSocket, cleanup, isConnected } = useWebSocketStore();

  useEffect(() => {
    if (user?.id) {
      initializeWebSocket();

      return () => {
        console.log("Cleaning up WebSocket connection");
        cleanup();
      };
    }
  }, [user?.id]);

  useEffect(() => {
    if (isConnected) {
      console.log("webSocket connected - user now online");
    } else {
      console.log("webSocket disconnected - user offline");
    }
  }, [isConnected]);

  useEffect(() => {
    if (isLoading) return;
    
    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      console.log("🔒 No user, redirecting to login");
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      console.log("✅ User exists, redirecting to tabs");
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
