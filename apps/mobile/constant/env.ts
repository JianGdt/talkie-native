export const ENV = {
  // API Configuration
  API_URL:
    process.env.EXPO_PUBLIC_API_URL || "https://wave-api-5k28.onrender.com",
  WS_URL:
    process.env.EXPO_PUBLIC_WS_URL || "wss://wave-api-5k28.onrender.com/ws",

  // SuEXPO_PUBLIC_WS_URLpabase Configuration
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
} as const;
