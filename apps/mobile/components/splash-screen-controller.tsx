import { useAuthContext } from "@/hooks/use-auth-context";
import { SplashScreen } from "expo-router";

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { loading } = useAuthContext();

  if (!loading) {
    SplashScreen.hideAsync();
  }

  return null;
}
