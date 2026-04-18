"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { Button } from "@pinpoint/shad-ui/components/button";
import { Input } from "@pinpoint/shad-ui/components/input";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { Search } from "lucide-react";
import { useState } from "react";
import { conversations } from "./dummydata";

export default function MessagesSidebar({ activeId, setActiveId }: { activeId: string; setActiveId: (id: string) => void }) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.handle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="flex h-screen w-72 flex-col border-background border-r bg-background-800/50 font-sans">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-widest">Messages</h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" size="15" />
          <Input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pr-3 pl-8 text-foreground text-sm transition-colors placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>
      </div>

      {/* Conversation list */}
      <nav className="scrollbar-thin flex flex-1 flex-col gap-5 space-y-0.5 overflow-y-auto px-2 pb-4">
        {filtered.length === 0 && <p className="mt-8 text-center text-muted-foreground text-sm">No results</p>}
        {filtered.map((convo) => {
          const isActive = activeId === convo.id;
          return (
            <Button
              key={convo.id}
              onClick={() => setActiveId(convo.id)}
              className={cn(
                "group flex w-full cursor-pointer items-center gap-3 rounded-xl px-5 py-6 text-left transition-all",
                isActive ? "bg-accent" : "hover:bg-accent/60"
              )}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={convo.avatar} alt={convo.name} />
                  <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                </Avatar>

                {convo.online && <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className={cn("truncate font-medium text-sm", isActive ? "text-foreground" : "text-foreground/90")}>{convo.name}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{convo.timestamp}</span>
                </div>

                <div className="mt-0.5 flex items-center justify-between gap-1">
                  <span className="truncate text-muted-foreground text-xs">{convo.lastMessage}</span>

                  {convo.unread > 0 && (
                    <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-primary px-1 font-semibold text-[10px] text-primary-foreground">
                      {convo.unread}
                    </span>
                  )}
                </div>
              </div>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
