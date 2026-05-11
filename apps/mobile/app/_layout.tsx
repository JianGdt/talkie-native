import { useEffect, useRef } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import "./global.css";
import { AuthProvider } from "@/context/AuthContext";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { useAuth } from "@/hooks/useAuth";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from "@expo-google-fonts/geist";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { initializeWebSocket, cleanup } = useWebSocketStore();
  const activeCall = useWebSocketStore((s) => s.activeCall);
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
  }, [user?.id, isLoading, initializeWebSocket, cleanup]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments, router]);

  useEffect(() => {
    if (!activeCall || !activeCall.isIncoming) return;
    if (activeCall.status !== "ringing") return;
    router.push("/(call)/incoming");
  }, [activeCall, router]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
