import "react-native-url-polyfill/auto";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import "./global.css";
import { AuthProvider } from "@/context/auth-context";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { useAuth } from "@/hooks/useAuth";
import { Poppins_600SemiBold, useFonts } from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { initializeWebSocket, cleanup, isConnected } = useWebSocketStore();

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
  });

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Initialize WebSocket with presence tracking
  useEffect(() => {
    if (session?.user?.id && session?.access_token) {
      console.log(
        "🔌 Initializing WebSocket with presence tracking for user:",
        session.user.id,
      );
      initializeWebSocket();

      return () => {
        console.log("👋 Cleaning up WebSocket connection");
        cleanup();
      };
    }
  }, [session?.user?.id, session?.access_token]);

  // Log WebSocket connection status
  useEffect(() => {
    if (isConnected) {
      console.log("✅ WebSocket connected - user is now online");
    } else {
      console.log("🔴 WebSocket disconnected - user is offline");
    }
  }, [isConnected]);

  // Navigation logic
  useEffect(() => {
    if (loading || !fontsLoaded) {
      console.log("⏳ Still loading, skipping navigation");
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      console.log("🔒 No session, redirecting to login");
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      console.log("✅ Session exists, redirecting to tabs");
      router.replace("/(tabs)");
    } else {
      console.log("📍 Navigation state:", {
        session: !!session,
        inAuthGroup,
        segments,
      });
    }
  }, [session, loading, fontsLoaded, segments]);

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
