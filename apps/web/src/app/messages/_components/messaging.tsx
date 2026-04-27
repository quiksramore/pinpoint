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
import { socketClientORPC } from "../../../lib/orpc-ws-client";

type Message = z.infer<typeof messageSchema>;

export default function Messaging({ chatroomId }: { chatroomId: string }) {
  const queryClient = useQueryClient();
  const { data: session } = authClientWeb.useSession();
  const userId = session?.user?.id;

  const { data: chatrooms } = useQuery(webClientORPC.chatroom.getChatrooms.queryOptions());
  const chatroom = useMemo(() => chatrooms?.find((c) => c._id === chatroomId), [chatrooms, chatroomId]);

  const { data: history } = useQuery({
    ...webClientORPC.chatroom.getMessageHistory.queryOptions({
      input: { chatroomId },
    }),
    enabled: !!chatroomId,
  });

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (history?.messages) {
      setMessages(history.messages);
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
          queryClient.invalidateQueries(webClientORPC.chatroom.getChatrooms.queryOptions());
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
      queryClient.invalidateQueries(webClientORPC.chatroom.getChatrooms.queryOptions());
    } catch (err) {
      console.error("Failed to send message:", err);
      // maybe add the message back to input or show error
    }
  };

  const isDirect = chatroom?.type === "DIRECT";
  const chatTitle = isDirect ? chatroom?.participants[0]?.username : chatroom?.title;
  const chatImage = isDirect ? chatroom?.participants[0]?.image : undefined;

  const name = chatTitle || "Loading...";

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      {/* Header */}
      <header className="flex w-full gap-3 border-background-700 border-b bg-background-800 p-4">
        <Avatar>
          <AvatarImage src={chatImage} />
          <AvatarFallback>{name.charAt(0)?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col justify-center">
          <h1 className="font-bold text-lg leading-tight">{name}</h1>
          {isDirect && <span className="text-muted-foreground text-xs">Direct Message</span>}
          {!isDirect && chatroom && <span className="text-muted-foreground text-xs">{chatroom.participants.length} participants</span>}
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex-1 space-y-3 p-5">
          {messages.map((msg, index) => {
            const isMe = msg.authorId === userId;
            const prev = messages[index - 1];
            const showAvatar = !prev || prev.authorId !== msg.authorId;

            let authorName = "Unknown";
            let authorImage;

            if (isMe) {
              authorName = session?.user?.name || "Me";
              authorImage = session?.user?.image || undefined;
            } else {
              const participant = chatroom?.participants.find((p) => p.participantId === msg.authorId);
              authorName = participant?.username || "Unknown";
              authorImage = participant?.image || undefined;
            }

            return (
              <div key={msg._id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                {/* Avatar (only when sender changes) */}
                {!isMe && showAvatar && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={authorImage} />
                    <AvatarFallback>{authorName.charAt(0)?.toUpperCase()}</AvatarFallback>
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
