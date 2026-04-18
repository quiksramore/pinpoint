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

export default function Messaging({ chatroomId }: { chatroomId: string }) {
  const queryClient = useQueryClient();
  const { data: session } = authClientWeb.useSession();
  const userId = session?.user?.id;

  const chatroomsQueryOptions = webClientORPC.chatroom.getChatrooms.queryOptions();
  const { data: chatrooms } = useQuery({
    ...chatroomsQueryOptions,
    enabled: !!userId,
    refetchOnMount: "always",
  });
  const chatroom = useMemo(() => chatrooms?.find((c) => c._id === chatroomId), [chatrooms, chatroomId]);
  const recipientId = useMemo(() => chatroom?.activeParticipantsId.find((id) => id !== userId), [chatroom, userId]);

  const { data: recipientProfile } = useQuery({
    ...webClientORPC.profile.getProfileById.queryOptions({
      input: { id: recipientId ?? "" },
    }),
    enabled: !!recipientId,
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
      } catch {
        setSubscriptionError("Live updates are temporarily unavailable.");
      }
    };

    subscribe();

    return () => {
      isCancelled = true;
    };
  }, [chatroomId, userId]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !chatroomId) return;

    setInput("");

    try {
      setSendError(null);
      const socketClientORPC = getSocketClientORPC();
      await socketClientORPC.publishChatMessage({
        chatroomId,
        message: trimmed,
      });
      await queryClient.invalidateQueries({ queryKey: historyQueryOptions.queryKey });
    } catch {
      setSendError("Failed to send message.");
    }
  };

  const name = recipientProfile?.username || "Loading...";

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
