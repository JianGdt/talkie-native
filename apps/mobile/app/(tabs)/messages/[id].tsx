import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChatMessages } from "@/hooks/useChatMessages";
import { formatMessageTime } from "@/utils/formats";
import { MESSAGE_MAX_LENGTH } from "@/constant/chats";
import { THEME } from "@/constant/theme";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { AvatarBadge } from "@/components/shared/AvatarBadge";
import { ProfileAvatar } from "@/components/shared/ProfileAvatar";
import { supabase } from "@/lib/supabase/client";

const ATTACHMENT_BUCKET = "message-attachments";
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

type AttachmentMeta = {
  url: string;
  name: string;
  mimeType: string;
  size: number;
  kind: "image" | "video" | "audio" | "pdf" | "document" | "file";
};

const getAttachmentKind = (mimeType: string): AttachmentMeta["kind"] => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("presentation") ||
    mimeType.includes("spreadsheet") ||
    mimeType === "text/plain"
  ) {
    return "document";
  }
  return "file";
};

const parseAttachment = (content: string): AttachmentMeta | null => {
  try {
    const data = JSON.parse(content);
    if (!data?.url || !data?.name) return null;
    return data;
  } catch {
    return null;
  }
};

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);

const formatAudioTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

function VoiceMessageBubble({
  url,
  isOwn,
}: {
  url: string;
  isOwn: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const progress = duration > 0 ? currentTime / duration : 0;

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  };

  return (
    <View
      className="flex-row items-center px-3 py-2.5"
      style={{ minWidth: 210 }}
    >
      {Platform.OS === "web" &&
        React.createElement("audio", {
          ref: audioRef,
          src: url,
          preload: "metadata",
          onLoadedMetadata: (event: any) =>
            setDuration(event.currentTarget.duration || 0),
          onTimeUpdate: (event: any) =>
            setCurrentTime(event.currentTarget.currentTime || 0),
          onPlay: () => setPlaying(true),
          onPause: () => setPlaying(false),
          onEnded: () => {
            setPlaying(false);
            setCurrentTime(0);
          },
          style: { display: "none" },
        })}

      <TouchableOpacity
        className="w-8 h-8 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: "white" }}
        activeOpacity={0.75}
        onPress={togglePlayback}
      >
        <Ionicons
          name={playing ? "pause" : "play"}
          size={16}
          color={isOwn ? THEME.accent : THEME.surface}
        />
      </TouchableOpacity>

      <View className="flex-row items-center flex-1 gap-1">
        {Array.from({ length: 22 }).map((_, index) => {
          const filled = index / 21 <= progress;
          const height = 8 + ((index * 7) % 18);
          return (
            <View
              key={index}
              className="rounded-full"
              style={{
                width: 3,
                height,
                backgroundColor: isOwn ? "white" : THEME.text,
                opacity: filled ? 0.95 : 0.32,
              }}
            />
          );
        })}
      </View>

      <Text
        className="text-xs font-semibold ml-3"
        style={{ color: isOwn ? "white" : THEME.text }}
      >
        {formatAudioTime(duration || currentTime)}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const {
    id,
    type,
    name,
    description,
    userId: otherUserId,
    avatar,
    activeCount,
  } =
    useLocalSearchParams<{
      id: string;
      type: string;
      name: string;
      description: string;
      userId?: string;
      avatar?: string;
      activeCount?: string;
    }>();

  const markConversationAsRead = useWebSocketStore(
    (state) => state.markConversationAsRead,
  );
  const isOnline = useWebSocketStore((state) =>
    otherUserId ? state.onlineUsers.has(otherUserId) : false,
  );

  useFocusEffect(
    useCallback(() => {
      if (id) markConversationAsRead(id);
    }, [id, markConversationAsRead]),
  );

  const { messages, loading, send, sendAttachment, userId } = useChatMessages(
    id,
    type,
  );
  const [inputText, setInputText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const fileInputRef = useRef<any>(null);
  const imageInputRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const sendCallInvite = useWebSocketStore((s) => s.sendCallInvite);

  const stopAudioStream = useCallback(() => {
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      stopAudioStream();
    };
  }, [stopAudioStream]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    send(inputText.trim());
    setInputText("");
  };

  const handleAttachPress = () => {
    if (Platform.OS !== "web") return;
    fileInputRef.current?.click?.();
  };

  const handleCameraPress = () => {
    if (Platform.OS !== "web") return;
    imageInputRef.current?.click?.();
  };

  const uploadAndSendAttachment = async (
    file: Blob,
    name: string,
    mimeType: string,
    kindOverride?: AttachmentMeta["kind"],
  ) => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      window.alert("Files must be 25 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const safeName = sanitizeFileName(name);
      const randomId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const kind = kindOverride ?? getAttachmentKind(mimeType);
      const storagePath = `${type}/${id}/${userId ?? "unknown"}/${randomId}-${safeName}`;

      const { error } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .upload(storagePath, file, {
          contentType: mimeType || "application/octet-stream",
          upsert: false,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(ATTACHMENT_BUCKET).getPublicUrl(storagePath);

      const attachment: AttachmentMeta = {
        url: publicUrl,
        name,
        mimeType: mimeType || "application/octet-stream",
        size: file.size,
        kind,
      };

      await sendAttachment(
        JSON.stringify(attachment),
        kind === "image" ? "image" : kind === "audio" ? "audio" : "file",
      );
    } catch (error) {
      console.error("Attachment upload failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Check that the message-attachments bucket allows authenticated uploads.";
      window.alert(`File upload failed: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelected = async (event: any) => {
    const file = event.target.files?.[0] as File | undefined;
    event.target.value = "";
    if (!file || uploading) return;

    await uploadAndSendAttachment(
      file,
      file.name,
      file.type || "application/octet-stream",
    );
  };

  const handleImageSelected = async (event: any) => {
    const file = event.target.files?.[0] as File | undefined;
    event.target.value = "";
    if (!file || uploading) return;

    await uploadAndSendAttachment(file, file.name, file.type || "image/jpeg");
  };

  const handleAudioPress = async () => {
    if (Platform.OS !== "web" || uploading) return;

    if (recordingAudio && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      window.alert("Audio recording is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      audioStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        setRecordingAudio(false);
        stopAudioStream();

        if (audioBlob.size > 0) {
          await uploadAndSendAttachment(
            audioBlob,
            `voice-${Date.now()}.webm`,
            mimeType,
            "audio",
          );
        }
      };

      recorder.start();
      setRecordingAudio(true);
    } catch (error) {
      console.error("Audio recording failed:", error);
      stopAudioStream();
      setRecordingAudio(false);
      window.alert("Allow microphone access to send audio.");
    }
  };

  const handleInputKeyPress = (event: any) => {
    if (Platform.OS !== "web") return;
    if (event.nativeEvent?.key !== "Enter") return;
    if (event.shiftKey || event.nativeEvent?.shiftKey) return;

    event.preventDefault?.();
    handleSend();
  };

  const openAttachment = (url: string) => {
    if (Platform.OS === "web") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.sender_id === userId;
    const time = formatMessageTime(item.created_at);
    const attachment =
      item.message_type === "image" ||
      item.message_type === "file" ||
      item.message_type === "audio"
        ? parseAttachment(item.content)
        : null;

    return (
      <View className={`mb-3 ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && (
          <Text
            className="text-[11px] mb-1 ml-2"
            style={{ color: THEME.textSubtle }}
          >
            {item.sender_username}
          </Text>
        )}

        {attachment ? (
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => {
              if (attachment.kind !== "audio") openAttachment(attachment.url);
            }}
            className={`max-w-[82%] overflow-hidden ${
              isOwn
                ? "rounded-[22px] rounded-br-md"
                : "rounded-[22px] rounded-bl-md"
            }`}
            style={{
              backgroundColor: isOwn ? THEME.accent : THEME.surfaceRaised,
            }}
          >
            {attachment.kind === "image" ? (
              <Image
                source={{ uri: attachment.url }}
                style={{ width: 240, height: 180, backgroundColor: "#e5e7eb" }}
                resizeMode="cover"
              />
            ) : attachment.kind === "audio" && Platform.OS === "web" ? (
              <VoiceMessageBubble url={attachment.url} isOwn={isOwn} />
            ) : attachment.kind === "video" && Platform.OS === "web" ? (
              React.createElement("video", {
                src: attachment.url,
                controls: true,
                style: {
                  width: 260,
                  maxWidth: "100%",
                  height: 180,
                  backgroundColor: "black",
                  display: "block",
                },
              })
            ) : (
              <View className="flex-row items-center gap-3 px-4 py-3">
                <View className="w-10 h-10 rounded-full bg-white/85 items-center justify-center">
                  <Ionicons
                    name={
                      attachment.kind === "pdf"
                        ? "document-text"
                        : "document-attach"
                    }
                    size={20}
                    color={THEME.accent}
                  />
                </View>
                <View className="flex-1 min-w-0">
                  <Text
                    className={`text-[14px] font-semibold ${
                      isOwn ? "text-white" : ""
                    }`}
                    style={!isOwn ? { color: THEME.text } : undefined}
                    numberOfLines={1}
                  >
                    {attachment.name}
                  </Text>
                  <Text
                    className={`text-[12px] ${
                      isOwn ? "text-white/80" : ""
                    }`}
                    style={!isOwn ? { color: THEME.textMuted } : undefined}
                  >
                    {formatFileSize(attachment.size)}
                  </Text>
                </View>
              </View>
            )}
            {(attachment.kind === "image" || attachment.kind === "video") && (
              <View className="px-3 py-2">
                <Text
                  className={`text-[12px] font-medium ${
                    isOwn ? "text-white" : ""
                  }`}
                  style={!isOwn ? { color: THEME.textMuted } : undefined}
                  numberOfLines={1}
                >
                  {attachment.name}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View
            className={`max-w-[82%] px-4 py-2.5 ${
              isOwn
                ? "rounded-[22px] rounded-br-md"
                : "rounded-[22px] rounded-bl-md"
            }`}
            style={{
              backgroundColor: isOwn ? THEME.accent : THEME.surfaceRaised,
            }}
          >
            <Text
              className={`text-[14px] leading-5 ${isOwn ? "text-white" : ""}`}
              style={!isOwn ? { color: THEME.text } : undefined}
            >
              {item.content}
            </Text>
          </View>
        )}

        <Text className="text-[10px] mt-1 mx-2" style={{ color: THEME.textSubtle }}>
          {time}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: THEME.bg }}
      >
        <ActivityIndicator size="large" color={THEME.accent} />
        <Text className="mt-4" style={{ color: THEME.textMuted }}>
          Loading messages...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: THEME.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        className="px-4 pt-12 pb-3 border-b"
        style={{ backgroundColor: THEME.bg, borderBottomColor: THEME.border }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5 flex-1 pr-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={26} color={THEME.text} />
            </TouchableOpacity>

            {avatar ? (
              <View className="relative">
                <ProfileAvatar
                  value={String(avatar)}
                  fallbackLabel={String(name ?? "?")}
                  size={40}
                />
                {isOnline ? (
                  <View
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                    style={{
                      backgroundColor: "#22c55e",
                      borderColor: THEME.bg,
                    }}
                  />
                ) : null}
              </View>
            ) : (
              <AvatarBadge
                colorClass="bg-emerald-500"
                label={String(name ?? "?").slice(0, 1).toUpperCase()}
                isActive={!!isOnline}
                size="sm"
              />
            )}

            <View className="flex-1">
              <Text
                className="text-[15px] font-semibold"
                style={{ color: THEME.text }}
                numberOfLines={1}
              >
                {name}
              </Text>
              <View className="flex-row items-center gap-2">
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isOnline ? "#22c55e" : "#9ca3af",
                    borderWidth: 2,
                    borderColor: THEME.bg,
                  }}
                />
                <Text
                  className="text-[12px]"
                  style={{ color: THEME.textMuted }}
                  numberOfLines={1}
                >
                  {type === "group"
                    ? `${activeCount ?? 0} active`
                    : description
                      ? description
                      : isOnline
                        ? "online"
                        : "offline"}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center border"
              style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}
              activeOpacity={0.7}
              onPress={() => {
                if (!otherUserId) return;
                const newCallId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                sendCallInvite({
                  toUserId: otherUserId,
                  callId: newCallId,
                  conversationId: id,
                  name: String(name ?? ""),
                });
                router.replace({
                  pathname: "/(call)/active",
                  params: {
                    callId: newCallId,
                    otherUserId,
                    name: String(name ?? ""),
                    role: "caller",
                  },
                });
              }}
            >
              <Ionicons name="call-outline" size={20} color={THEME.text} />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center border"
              style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={THEME.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, i) => item.id ?? `msg-${i}`}
        className="flex-1 px-4"
        style={{ backgroundColor: THEME.bg }}
        contentContainerStyle={{ paddingVertical: 16 }}
      />

      <View
        className="px-4 pt-3 pb-4 border-t"
        style={{ backgroundColor: THEME.bg, borderTopColor: THEME.border }}
      >
        {Platform.OS === "web" &&
          React.createElement("input", {
            ref: fileInputRef,
            type: "file",
            accept:
              ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            style: { display: "none" },
            onChange: handleFileSelected,
          })}
        {Platform.OS === "web" &&
          React.createElement("input", {
            ref: imageInputRef,
            type: "file",
            accept: "image/*,video/*",
            capture: "environment",
            style: { display: "none" },
            onChange: handleImageSelected,
          })}
        <View className="flex-row items-end gap-2">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            activeOpacity={0.7}
            onPress={handleAttachPress}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={THEME.accent} />
            ) : (
              <Ionicons name="attach" size={21} color={THEME.text} />
            )}
          </TouchableOpacity>

          <View className="flex-1 rounded-xl flex-row items-end px-4 py-3 bg-gray-100">
            <TextInput
              className="flex-1 text-[14px]"
              placeholder="Write your message"
              placeholderTextColor="#8a8f98"
              value={inputText}
              onChangeText={setInputText}
              onKeyPress={handleInputKeyPress}
              multiline
              maxLength={MESSAGE_MAX_LENGTH}
              style={{ paddingVertical: 0, outline: "none", color: "#111827" }}
            />
            <TouchableOpacity
              className="ml-2 w-9 h-9 rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            onPress={handleCameraPress}
            disabled={uploading}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={24} color={THEME.text} />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            onPress={inputText.trim() ? handleSend : handleAudioPress}
            disabled={uploading}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                inputText.trim()
                  ? "send"
                  : recordingAudio
                    ? "stop-circle"
                    : "mic-outline"
              }
              size={24}
              color={recordingAudio ? "#ef4444" : THEME.text}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
