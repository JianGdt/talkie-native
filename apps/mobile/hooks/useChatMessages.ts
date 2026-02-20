import { useState, useEffect, useRef } from "react";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { channelService } from "@/api/services/channelServices";
import { conversationService } from "@/api/services/conversationServices";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
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
  const processedIds = useRef(new Set<string>());

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        const data =
          type === "channel"
            ? await channelService.getMessages(
                conversationId,
                50,
                undefined,
                token,
              )
            : await conversationService.getMessages(
                conversationId,
                50,
                undefined,
                token,
              );

        setMessages(data);
        data.forEach((m: any) => m.id && processedIds.current.add(m.id));
      } catch (e) {
        console.error("Failed to fetch messages:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId]);

  useEffect(() => {
    wsMessages
      .filter(
        (msg) =>
          msg.type === "message" &&
          (type === "channel"
            ? msg.payload.channelId === conversationId
            : msg.payload.conversationId === conversationId),
      )
      .forEach((msg) => {
        const { messageId, content, sender, timestamp } = msg.payload;
        if (!messageId || processedIds.current.has(messageId)) return;
        processedIds.current.add(messageId);
        if (msg.userId === user?.id) return;

        const ts =
          typeof timestamp === "string"
            ? parseFloat(timestamp)
            : (timestamp ?? msg.timestamp);
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
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

  return { messages, loading, send, userId: user?.id };
}
