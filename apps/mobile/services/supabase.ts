import { ENV } from "@/constant/ENV";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

// AsyncStorage adapter for Supabase
const ExpoAsyncStorageAdapter = {
  getItem: (key: string) => {
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    return AsyncStorage.removeItem(key);
  },
};

// Create Supabase client
export const supabase = createClient(
  ENV.SUPABASE_URL ?? "",
  process.env.EXPO_PUBLIC_SUPABASE_KEY ?? "",
  {
    auth: {
      storage: ExpoAsyncStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
