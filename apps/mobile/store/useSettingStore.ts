import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  pushNotifications: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  autoJoin: boolean;
  hydrated: boolean;

  hydrate: () => Promise<void>;

  setPushNotifications: (v: boolean) => void;
  setSoundEffects: (v: boolean) => void;
  setHapticFeedback: (v: boolean) => void;
  setAutoJoin: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  pushNotifications: true,
  soundEffects: true,
  hapticFeedback: true,
  autoJoin: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem("app-settings");
      if (stored) {
        set({ ...JSON.parse(stored) });
      }
    } catch (e) {
      console.log("Failed to load settings", e);
    } finally {
      set({ hydrated: true });
    }
  },

  setPushNotifications: async (v) => {
    set({ pushNotifications: v });
    await AsyncStorage.setItem(
      "app-settings",
      JSON.stringify({ ...get(), pushNotifications: v }),
    );
  },

  setSoundEffects: async (v) => {
    set({ soundEffects: v });
    await AsyncStorage.setItem(
      "app-settings",
      JSON.stringify({ ...get(), soundEffects: v }),
    );
  },

  setHapticFeedback: async (v) => {
    set({ hapticFeedback: v });
    await AsyncStorage.setItem(
      "app-settings",
      JSON.stringify({ ...get(), hapticFeedback: v }),
    );
  },

  setAutoJoin: async (v) => {
    set({ autoJoin: v });
    await AsyncStorage.setItem(
      "app-settings",
      JSON.stringify({ ...get(), autoJoin: v }),
    );
  },
}));
