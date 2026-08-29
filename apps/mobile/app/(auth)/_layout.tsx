import { useAuth } from "@/hooks/useAuth";
import { Redirect, Stack, useSegments } from "expo-router";

export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const isResetPassword = segments[1] === "reset-password";

  if (isLoading) return null;
  if (user && !isResetPassword) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
  
