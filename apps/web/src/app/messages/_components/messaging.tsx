"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { Button } from "@pinpoint/shad-ui/components/button";
import { Input } from "@pinpoint/shad-ui/components/input";
import { ScrollArea } from "@pinpoint/shad-ui/components/scroll-area";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { useState } from "react";

type Message = {
  id: string;
  text: string;
  sender: "me" | "them";
};

export default function Messaging({ name }: { name: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hey 👋", sender: "them" },
    { id: "2", text: "What's up?", sender: "them" },
  ]);

  const [input, setInput] = useState("");

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      text: trimmed,
      sender: "me",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      {/* Header */}
      <header className="flex w-full gap-2 border-background-700 border-b bg-background-800 p-5">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <h1 className="font-bold text-lg">{name}</h1>
      </header>

      {/* Messages */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex-1 space-y-3 p-5">
          {messages.map((msg, index) => {
            const prev = messages[index - 1];
            const showAvatar = !prev || prev.sender !== msg.sender;

            return (
              <div key={msg.id} className={cn("flex items-end gap-2", msg.sender === "me" ? "justify-end" : "justify-start")}>
                {/* Avatar (only when sender changes) */}
                {msg.sender !== "me" && showAvatar && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                )}

                {/* Spacer to align grouped messages */}
                {msg.sender !== "me" && !showAvatar && <div className="w-8" />}

                {/* Message bubble */}
                <div
                  className={cn(
                    "wrap-anywhere max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                    msg.sender === "me" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {msg.text}
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
