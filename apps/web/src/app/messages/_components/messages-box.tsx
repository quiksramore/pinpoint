"use client";

import { useState } from "react";
import MessagesSidebar from "./messages-sidebar";
import Messaging from "./messaging";

export default function MessagesBox() {
  const [activeId, setActiveId] = useState<string | undefined>();

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <MessagesSidebar activeId={activeId} setActiveId={setActiveId} />
      {activeId ? (
        <Messaging chatroomId={activeId} />
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">Select a conversation to start messaging</div>
      )}
    </div>
  );
}
