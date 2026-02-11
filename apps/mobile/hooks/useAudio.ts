import { useState, useCallback, useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";
import audioService from "../services/audio.service";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { MessageType, TransmissionStatus } from "@/@types/talkie";

export const useAudioTransmission = (
  channelId: string | null,
  userId: string,
) => {
  const [transmissionStatus, setTransmissionStatus] =
    useState<TransmissionStatus>("idle");

  const [isInitialized, setIsInitialized] = useState(false);

  const {
    sendAudioMessage,
    sendTransmissionStart,
    sendTransmissionEnd,
    messages,
  } = useWebSocketStore();

  // Keep track of last processed message to prevent duplicate handling
  const lastMessageRef = useRef<number>(0);

  // ===============================
  // Initialize Audio
  // ===============================
  useEffect(() => {
    let mounted = true;

    const initAudio = async () => {
      try {
        await audioService.initialize();
        if (mounted) setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize audio:", error);
        if (mounted) setIsInitialized(false);
      }
    };

    initAudio();

    return () => {
      mounted = false;
      audioService.cleanup();
    };
  }, []);

  // ===============================
  // Handle Incoming WebSocket Audio
  // ===============================
  useEffect(() => {
    if (!channelId || messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];

    // Prevent re-processing same message
    if (!latestMessage || lastMessageRef.current === messages.length) return;

    lastMessageRef.current = messages.length;

    const { type, payload, userId: senderId } = latestMessage;

    if (!payload || payload.channelId !== channelId) return;
    if (senderId === userId) return;

    switch (type) {
      case MessageType.AUDIO_DATA:
        setTransmissionStatus("receiving");
        audioService
          .playAudioFromBase64(payload.audioData)
          .catch((err) => {
            console.error("Failed to play audio:", err);
          })
          .finally(() => {
            setTransmissionStatus("idle");
          });
        break;

      case MessageType.TRANSMISSION_STARTED:
        setTransmissionStatus("receiving");
        break;

      case MessageType.TRANSMISSION_ENDED:
        setTransmissionStatus("idle");
        break;
    }
  }, [messages, channelId, userId]);

  // ===============================
  // Start Transmission
  // ===============================
  const startTransmission = useCallback(async () => {
    if (!channelId || !isInitialized) return;
    if (transmissionStatus !== "idle") return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setTransmissionStatus("transmitting");

      sendTransmissionStart(channelId);

      await audioService.startRecording();
    } catch (error) {
      console.error("Failed to start transmission:", error);
      setTransmissionStatus("error");

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setTimeout(() => setTransmissionStatus("idle"), 500);
    }
  }, [channelId, isInitialized, transmissionStatus, sendTransmissionStart]);

  // ===============================
  // End Transmission
  // ===============================
  const endTransmission = useCallback(async () => {
    if (!channelId) return;
    if (transmissionStatus !== "transmitting") return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const audioData = await audioService.stopRecording();

      if (audioData?.base64) {
        sendAudioMessage(channelId, audioData.base64, audioData.duration ?? 0);
      }

      sendTransmissionEnd(channelId);
      setTransmissionStatus("idle");
    } catch (error) {
      console.error("Failed to end transmission:", error);

      setTransmissionStatus("error");

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setTimeout(() => setTransmissionStatus("idle"), 500);
    }
  }, [channelId, transmissionStatus, sendAudioMessage, sendTransmissionEnd]);

  return {
    transmissionStatus,
    startTransmission,
    endTransmission,
    isInitialized,
  };
};
