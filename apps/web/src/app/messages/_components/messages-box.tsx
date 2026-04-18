"use client";

import { useState } from "react";
import MessagesSidebar from "./messages-sidebar";
import Messaging from "./messaging";

type ActiveChat = {
  id: string;
  recipientId?: string;
};

export default function MessagesBox() {
  const [activeChat, setActiveChat] = useState<ActiveChat | undefined>();

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <MessagesSidebar activeId={activeChat?.id} setActiveChat={setActiveChat} />
      {activeChat ? (
        <Messaging chatroomId={activeChat.id} recipientId={activeChat.recipientId} />
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">Select a conversation to start messaging</div>
      )}
    </div>
  );
}
