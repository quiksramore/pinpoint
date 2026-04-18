"use client";

import type { messageSchema } from "@pinpoint/contracts";
import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { Button } from "@pinpoint/shad-ui/components/button";
import { Input } from "@pinpoint/shad-ui/components/input";
import { ScrollArea } from "@pinpoint/shad-ui/components/scroll-area";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { z } from "zod";
import { authClientWeb } from "../../../lib/auth-client-web";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { getSocketClientORPC } from "../../../lib/orpc-ws-client";

type Message = z.infer<typeof messageSchema>;

type ErrorWithDataMessage = {
  message?: string;
  data?: {
    message?: string;
  };
  cause?: unknown;
};

const FALLBACK_RECIPIENT_ID_PREVIEW_LENGTH = 6;
const SUBSCRIPTION_RETRY_DELAY_MS = 1500;

function formatErrorDetails(error: unknown, fallback: string) {
  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as ErrorWithDataMessage;
    const dataMessage = maybeError.data?.message;
    if (typeof dataMessage === "string" && dataMessage.length > 0) {
      return dataMessage;
    }

    if (typeof maybeError.message === "string" && maybeError.message.length > 0) {
      return maybeError.message;
    }

    if (typeof maybeError.cause === "string" && maybeError.cause.length > 0) {
      return maybeError.cause;
    }
  }

  return fallback;
}

export default function Messaging({ chatroomId, recipientId }: { chatroomId: string; recipientId?: string }) {
  const queryClient = useQueryClient();
  const { data: session } = authClientWeb.useSession();
  const userId = session?.user?.id;

  const chatroomsQueryOptions = webClientORPC.chatroom.getChatrooms.queryOptions();
  const { data: chatrooms } = useQuery({
    ...chatroomsQueryOptions,
    enabled: !recipientId && !!userId,
  });

  const derivedRecipientId = useMemo(() => {
    if (!chatrooms || !userId) return undefined;
    const activeChatroom = chatrooms.find((chatroom) => chatroom._id === chatroomId);
    return activeChatroom?.activeParticipantsId.find((id) => id !== userId);
  }, [chatroomId, chatrooms, userId]);

  const activeRecipientId = recipientId ?? derivedRecipientId;

  const { data: recipientProfile } = useQuery({
    ...webClientORPC.profile.getProfileById.queryOptions({
      input: { id: activeRecipientId ?? "" },
    }),
    enabled: !!activeRecipientId,
  });

  const historyQueryOptions = webClientORPC.chatroom.getMessageHistory.queryOptions({
    input: { chatroomId },
  });

  const { data: history } = useQuery({
    ...historyQueryOptions,
    enabled: !!chatroomId && !!userId,
    refetchInterval: 4000,
    refetchOnMount: "always",
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const [input, setInput] = useState("");

  useEffect(() => {
    if (history) {
      setMessages(history);
    }
  }, [history]);

  useEffect(() => {
    if (!chatroomId || !userId) return;

    let isCancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleReconnect = () => {
      if (isCancelled) return;
      retryTimer = setTimeout(() => {
        subscribe().catch(() => {
          // Errors are handled inside subscribe.
        });
      }, SUBSCRIPTION_RETRY_DELAY_MS);
    };

    const subscribe = async () => {
      try {
        setSubscriptionError(null);
        const socketClientORPC = getSocketClientORPC();
        const iterator = await socketClientORPC.subscribeChatRoom({ id: chatroomId });
        for await (const event of iterator) {
          if (isCancelled) break;
          const msg = event.incomingMessage;
          setMessages((prev) => {
            if (prev.find((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        }

        scheduleReconnect();
      } catch (error) {
        setSubscriptionError(`Live updates unavailable: ${formatErrorDetails(error, "unknown websocket error")}`);
        scheduleReconnect();
      }
    };

    subscribe().catch(() => {
      // Errors are handled inside subscribe.
    });

    return () => {
      isCancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [chatroomId, userId]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !chatroomId || !userId) return;

    if (!activeRecipientId) {
      setSendError("No active recipient for this chatroom.");
      return;
    }

    setInput("");

    try {
      setSendError(null);
      const socketClientORPC = getSocketClientORPC();
      await socketClientORPC.publishChatMessage({
        chatroomId,
        message: trimmed,
      });
      await queryClient.invalidateQueries({ queryKey: historyQueryOptions.queryKey });
    } catch (error) {
      setInput(trimmed);
      setSendError(`Failed to send message: ${formatErrorDetails(error, "unknown websocket error")}`);
    }
  };

  const fallbackName = activeRecipientId ? `User ${activeRecipientId.slice(0, FALLBACK_RECIPIENT_ID_PREVIEW_LENGTH)}` : "Loading...";
  const name = recipientProfile?.username || fallbackName;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      {/* Header */}
      <header className="flex w-full gap-2 border-background-700 border-b bg-background-800 p-5">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h1 className="font-bold text-lg">{name}</h1>
      </header>

      {/* Messages */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex-1 space-y-3 p-5">
          {messages.map((msg, index) => {
            const isMe = msg.authorId === userId;
            const prev = messages[index - 1];
            const showAvatar = !prev || prev.authorId !== msg.authorId;

            return (
              <div key={msg._id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                {/* Avatar (only when sender changes) */}
                {!isMe && showAvatar && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}

                {/* Spacer to align grouped messages */}
                {!isMe && !showAvatar && <div className="w-8" />}

                {/* Message bubble */}
                <div
                  className={cn(
                    "wrap-anywhere max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                    isMe ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          {subscriptionError && <p className="text-center text-destructive text-xs">{subscriptionError}</p>}
        </div>
      </ScrollArea>

      {/* Input */}
      <footer className="flex w-full items-center border-background-700 border-t bg-background-800 p-5">
        <Input
          type="text"
          placeholder="Type your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <Button className="ml-2 cursor-pointer" onClick={sendMessage}>
          Send
        </Button>
      </footer>
      {sendError && <p className="px-5 py-2 text-destructive text-xs">{sendError}</p>}
    </div>
  );
}
