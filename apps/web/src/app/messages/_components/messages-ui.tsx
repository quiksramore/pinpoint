"use client";

import { useState } from "react";
import MessagesSidebar from "./messages-sidebar";

export default function MessagesUI() {
  const [activeId, setActiveId] = useState<string>("1");

  return (
    <div>
      <MessagesSidebar activeId={activeId} setActiveId={setActiveId} />
    </div>
  );
}
