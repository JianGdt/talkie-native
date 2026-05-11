import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  pushNotifications: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  autoJoin: boolean;
  hydrated: boolean;

  hydrate: () => Promise<void>;

  setPushNotifications: (isVolume: boolean) => void;
  setSoundEffects: (isVolume: boolean) => void;
  setHapticFeedback: (isVolume: boolean) => void;
  setAutoJoin: (isVolume: boolean) => void;
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

  setPushNotifications: async (isVolume: boolean) => {
    set({ pushNotifications: isVolume });
    await AsyncStorage.setItem(
      "app-settings",
      JSON.stringify({ ...get(), pushNotifications: isVolume }),
    );
  },

  setSoundEffects: async (isVolume: boolean) => {
    set({ soundEffects: isVolume });
    await AsyncStorage.setItem(
      "app-settings",
      JSON.stringify({ ...get(), soundEffects: isVolume }),
    );
  },

  setHapticFeedback: async (isVolume: boolean) => {
    set({ hapticFeedback: isVolume });
    await AsyncStorage.setItem(
      "app-settings",
      JSON.stringify({ ...get(), hapticFeedback: isVolume }),
    );
  },

  setAutoJoin: async (isVolume: boolean) => {
    set({ autoJoin: isVolume });
    await AsyncStorage.setItem(
      "app-settings",
      JSON.stringify({ ...get(), autoJoin: isVolume }),
    );
  },
}));
