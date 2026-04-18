"use client";

import { useState } from "react";
import { conversations } from "./dummydata";
import MessagesSidebar from "./messages-sidebar";
import Messaging from "./messaging";

export default function MessagesUI() {
  const [activeId, setActiveId] = useState<string>("1");
  const getConversationName = (id: string) => conversations.find((c) => c.id === id)?.name;

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <MessagesSidebar activeId={activeId} setActiveId={setActiveId} />
      <Messaging name={getConversationName(activeId) || "Unknown"} />
    </div>
  );
}
