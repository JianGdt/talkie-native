import { useState, useEffect, useRef } from "react";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { channelService } from "@/api/services/channelServices";
import { conversationService } from "@/api/services/conversationServices";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/api/client";
import { MessageType } from "@/@types/talkie";

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_username: string;
  created_at: string;
}

export function useChatMessages(conversationId: string, type: string) {
  const { user } = useAuth();
  const { sendMessage, messages: wsMessages } = useWebSocketStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const processedIds = useRef(new Set<string>());

  useEffect(() => {
    const controller = new AbortController();

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const data =
          type === "channel"
            ? await channelService.getMessages(conversationId, {
                limit: 50,
                signal: controller.signal,
              })
            : await conversationService.getMessages(conversationId, {
                limit: 50,
                signal: controller.signal,
              });

        setMessages(data);
        data.forEach((m) => m.id && processedIds.current.add(m.id));
      } catch (err) {
        if (err instanceof ApiError) {
          setError("Failed to load messages. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    return () => controller.abort();
  }, [conversationId, type]);

  useEffect(() => {
    wsMessages
      .filter(
        (msg) =>
          msg.type === MessageType.MESSAGE &&
          (type === "channel"
            ? msg.payload.channelId === conversationId
            : msg.payload.conversationId === conversationId),
      )
      .forEach((msg) => {
        const { messageId, content, sender, timestamp } = msg.payload;

        if (sender?.userId === user?.id) return;

        const uniqueKey = messageId ?? `ws-${sender?.userId}-${timestamp}`;
        if (processedIds.current.has(uniqueKey)) return;
        processedIds.current.add(uniqueKey);

        const ts =
          typeof timestamp === "string"
            ? parseFloat(timestamp)
            : (timestamp ?? msg.timestamp);

        setMessages((prev) => [
          ...prev,
          {
            id: uniqueKey,
            content,
            sender_id: sender?.userId ?? msg.userId,
            sender_username: sender?.username ?? msg.username,
            created_at: new Date(ts).toISOString(),
          },
        ]);
      });
  }, [wsMessages]);

  const send = (content: string) => {
    if (!content.trim()) return;

    const tempId = `temp-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content,
        sender_id: user?.id ?? "",
        sender_username: user?.username ?? "",
        created_at: new Date().toISOString(),
      },
    ]);
    processedIds.current.add(tempId);

    sendMessage({
      type: MessageType.MESSAGE,
      payload: {
        ...(type === "channel"
          ? { channelId: conversationId }
          : { conversationId }),
        content,
        sender: { userId: user?.id, username: user?.username },
      },
      timestamp: Date.now(),
    });
  };

  return { messages, loading, error, send, userId: user?.id };
}
