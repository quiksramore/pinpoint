"use client";

import type { chatroomPreviewSchema } from "@pinpoint/contracts";
import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { Button } from "@pinpoint/shad-ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@pinpoint/shad-ui/components/dialog";
import { Input } from "@pinpoint/shad-ui/components/input";
import { ScrollArea } from "@pinpoint/shad-ui/components/scroll-area";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, SquarePen } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import { authClientWeb } from "../../../lib/auth-client-web";
import { webClientORPC } from "../../../lib/orpc-web-client";

export default function MessagesSidebar({ activeId, setActiveId }: { activeId: string | undefined; setActiveId: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [newChatUsername, setNewChatUsername] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: session } = authClientWeb.useSession();
  const userId = session?.user?.id;

  const { data: chatrooms } = useQuery(webClientORPC.chatroom.getChatrooms.queryOptions());

  const startChatMutation = useMutation(
    webClientORPC.chatroom.createDirectChat.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(webClientORPC.chatroom.getChatrooms.queryOptions());
        setActiveId(data.id);
        setIsDialogOpen(false);
        setNewChatUsername("");
        setError(null);
      },
      onError: (err: any) => {
        setError(err?.data?.message || "Failed to start chat");
      },
    })
  );

  const handleStartChat = async () => {
    if (!newChatUsername.trim()) return;
    setError(null);

    try {
      const profile = await queryClient.fetchQuery(
        webClientORPC.profile.getProfileByUsername.queryOptions({
          input: { username: newChatUsername.trim() },
        })
      );

      if (profile._id === userId) {
        setError("You cannot start a chat with yourself");
        return;
      }

      startChatMutation.mutate({ recipientId: profile._id });
    } catch (err: any) {
      setError(err?.data?.message || "User not found");
    }
  };

  const chatroomList = () => {
    if (!chatrooms || !userId) return [];
    return chatrooms;
  };

  return (
    <ScrollArea className="h-full w-80 border-background border-r bg-background-800/50 font-sans">
      <aside className="flex h-full w-80 flex-col border-background border-r bg-background-800/50 font-sans">
        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-sm uppercase tracking-widest">Messages</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <SquarePen size={18} />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                  <DialogDescription>Enter the username of the person you want to message.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Username"
                    value={newChatUsername}
                    onChange={(e) => {
                      setNewChatUsername(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleStartChat();
                    }}
                  />
                  {error && <p className="mt-2 text-destructive text-xs">{error}</p>}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleStartChat} disabled={startChatMutation.isPending || !newChatUsername.trim()}>
                    {startChatMutation.isPending ? "Starting..." : "Start Chat"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
          {chatroomList().length === 0 && <p className="mt-8 text-center text-muted-foreground text-sm">No results</p>}
          {chatroomList().map((chatroom) => (
            <ChatroomItem
              key={chatroom._id}
              chatroom={chatroom}
              isActive={activeId === chatroom._id}
              onClick={() => setActiveId(chatroom._id)}
              search={search}
            />
          ))}
        </nav>
      </aside>
    </ScrollArea>
  );
}

function ChatroomItem({
  chatroom,
  isActive,
  onClick,
  search,
}: {
  chatroom: z.infer<typeof chatroomPreviewSchema>;
  isActive: boolean;
  onClick: () => void;
  search: string;
}) {
  const isDirect = chatroom.type === "DIRECT";
  const title = isDirect ? chatroom.participants[0]?.username : chatroom.title;

  if (search && !title?.toLowerCase().includes(search.toLowerCase())) {
    return null;
  }

  const lastMessage = chatroom.lastMessage;

  return (
    <Button
      onClick={onClick}
      variant="ghost"
      className={cn(
        "group flex h-auto w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left transition-all",
        isActive ? "bg-accent" : "hover:bg-accent/60"
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={isDirect ? chatroom.participants[0]?.image : undefined} alt={title} />
          <AvatarFallback>{title?.charAt(0)?.toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className={cn("truncate font-medium text-sm", isActive ? "text-foreground" : "text-foreground/90")}>{title}</span>
          {lastMessage && (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-muted-foreground text-xs">{lastMessage ? lastMessage.content : "No messages yet"}</p>
        </div>
      </div>
    </Button>
  );
}
