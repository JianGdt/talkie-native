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
  message_type?: string;
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
        const { messageId, content, sender, timestamp, messageType } =
          msg.payload;
        const senderId = sender?.userId ?? msg.userId;
        const senderName = sender?.username ?? msg.username;

        if (!senderId) return;
        if (senderId === user?.id) return;

        const uniqueKey = messageId ?? `ws-${senderId}-${timestamp}`;
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
            message_type: messageType ?? "text",
            sender_id: senderId,
            sender_username: senderName ?? "",
            created_at: new Date(ts).toISOString(),
          },
        ]);
      });
  }, [wsMessages]);

  const addOptimisticMessage = (content: string, messageType: string) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content,
        message_type: messageType,
        sender_id: user?.id ?? "",
        sender_username: user?.username ?? "",
        created_at: new Date().toISOString(),
      },
    ]);
    processedIds.current.add(tempId);

    return tempId;
  };

  const send = (content: string, messageType: string = "text") => {
    if (!content.trim()) return;

    addOptimisticMessage(content, messageType);

    sendMessage({
      type: MessageType.MESSAGE,
      payload: {
        ...(type === "channel"
          ? { channelId: conversationId }
          : { conversationId }),
        content,
        messageType,
        sender: { userId: user?.id, username: user?.username },
      },
      timestamp: Date.now(),
    });
  };

  const sendAttachment = async (
    content: string,
    messageType: "image" | "file" | "audio" = "file",
  ) => {
    if (!content.trim()) return;

    const tempId = addOptimisticMessage(content, messageType);

    try {
      const saved =
        type === "channel"
          ? await channelService.sendMessage(conversationId, content, messageType)
          : await conversationService.sendMessage(
              conversationId,
              content,
              messageType,
            );

      processedIds.current.add(saved.id);
      setMessages((prev) =>
        prev.map((message) => (message.id === tempId ? saved : message)),
      );
    } catch (err) {
      processedIds.current.delete(tempId);
      setMessages((prev) => prev.filter((message) => message.id !== tempId));
      throw err;
    }
  };

  return { messages, loading, error, send, sendAttachment, userId: user?.id };
}
