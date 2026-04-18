"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { Button } from "@pinpoint/shad-ui/components/button";
import { Input } from "@pinpoint/shad-ui/components/input";
import { ScrollArea } from "@pinpoint/shad-ui/components/scroll-area";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { messageSchema } from "@pinpoint/contracts";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { authClientWeb } from "../../../lib/auth-client-web";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { socketClientORPC } from "../../../lib/orpc-ws-client";

type Message = z.infer<typeof messageSchema>;

export default function Messaging({ chatroomId }: { chatroomId: string }) {
  const { data: session } = authClientWeb.useSession();
  const userId = session?.user?.id;

  const { data: chatrooms } = useQuery(webClientORPC.chatroom.getChatrooms.queryOptions());
  const chatroom = useMemo(() => chatrooms?.find((c) => c._id === chatroomId), [chatrooms, chatroomId]);
  const recipientId = useMemo(() => chatroom?.activeParticipantsId.find((id) => id !== userId), [chatroom, userId]);

  const { data: recipientProfile } = useQuery({
    ...webClientORPC.profile.getProfileById.queryOptions({
      input: { id: recipientId ?? "" },
    }),
    enabled: !!recipientId,
  });

  const { data: history } = useQuery({
    ...webClientORPC.chatroom.getMessageHistory.queryOptions({
      input: { chatroomId },
    }),
    enabled: !!chatroomId,
  });

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (history) {
      setMessages(history);
    }
  }, [history]);

  useEffect(() => {
    if (!chatroomId) return;

    let isCancelled = false;
    const subscribe = async () => {
      try {
        const iterator = await socketClientORPC.subscribeChatRoom({ id: chatroomId });
        for await (const event of iterator) {
          if (isCancelled) break;
          const msg = event.incomingMessage;
          setMessages((prev) => {
            if (prev.find((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        }
      } catch (err) {
        console.error("Failed to subscribe to chatroom:", err);
      }
    };

    subscribe();

    return () => {
      isCancelled = true;
    };
  }, [chatroomId]);

  const [input, setInput] = useState("");

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !chatroomId) return;

    setInput("");

    try {
      await socketClientORPC.publishChatMessage({
        chatroomId,
        message: trimmed,
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      // maybe add the message back to input or show error
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
    </div>
  );
}
