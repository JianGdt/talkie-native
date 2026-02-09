import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "./global.css"; // Import your global CSS with Tailwind directives

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
