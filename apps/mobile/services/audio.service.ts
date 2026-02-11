import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

class AudioService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();

      if (status !== "granted") {
        throw new Error("Permission to access microphone was denied");
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
      console.log("✅ Audio service initialized");
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      throw error;
    }
  }

  async startRecording(): Promise<void> {
    try {
      if (this.recording) {
        console.warn("Recording already in progress");
        return;
      }

      // Ensure audio mode is set
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();

      await recording.prepareToRecordAsync({
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 128000,
        },
      });

      await recording.startAsync();
      this.recording = recording;

      console.log("🎤 Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      this.recording = null;
      throw error;
    }
  }

  async stopRecording(): Promise<string | null> {
    if (!this.recording) {
      console.warn("No recording in progress");
      return null;
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      // Reset audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (uri) {
        // Convert to base64 for transmission
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log(
          "🛑 Recording stopped, size:",
          (base64.length / 1024).toFixed(2),
          "KB",
        );
        return base64;
      }

      return null;
    } catch (error) {
      console.error("Failed to stop recording:", error);
      this.recording = null;
      throw error;
    }
  }

  async playAudioFromBase64(base64: string): Promise<void> {
    try {
      // Stop any currently playing sound
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Create temp file
      const tempUri = `${FileSystem.cacheDirectory}temp_audio_${Date.now()}.m4a`;
      await FileSystem.writeAsStringAsync(tempUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create and play sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: tempUri },
        { shouldPlay: true, volume: 1.0 },
      );

      this.sound = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          // Clean up temp file
          FileSystem.deleteAsync(tempUri, { idempotent: true });
        }
      });

      console.log("🔊 Playing audio");
    } catch (error) {
      console.error("Failed to play audio:", error);
      throw error;
    }
  }

  async cleanup() {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }

  isRecording(): boolean {
    return this.recording !== null;
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}

export default new AudioService();
