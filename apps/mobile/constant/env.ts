export const ENV = {
  // API Configuration
  API_URL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.10:3001",
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || "http://192.168.1.10:3001/ws",

  // SuEXPO_PUBLIC_WS_URLpabase Configuration
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
} as const;
