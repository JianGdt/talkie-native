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
  const { initializeWebSocket, cleanup } = useWebSocketStore();

  useEffect(() => {
    if (session) {
      initializeWebSocket();
    }
    return () => {
      cleanup();
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (loading) {
      console.log("⏳ Still loading, skipping navigation");
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    } else {
      console.log("running");
    }
  }, [session, loading, segments]);

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
