"use client";

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
import { useMemo, useState } from "react";
import { authClientWeb } from "../../../lib/auth-client-web";
import { webClientORPC } from "../../../lib/orpc-web-client";

type ErrorWithDataMessage = {
  data?: {
    message?: string;
  };
};

const FALLBACK_ID_PREVIEW_LENGTH = 6;

type ActiveChatSelection = {
  id: string;
  recipientId?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as ErrorWithDataMessage;
    if (typeof maybeError.data?.message === "string" && maybeError.data.message.length > 0) {
      return maybeError.data.message;
    }
  }
  return fallback;
}

export default function MessagesSidebar({
  activeId,
  setActiveChat,
}: {
  activeId: string | undefined;
  setActiveChat: (chat: ActiveChatSelection) => void;
}) {
  const [search, setSearch] = useState("");
  const [newChatUsername, setNewChatUsername] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: session } = authClientWeb.useSession();
  const userId = session?.user?.id;

  const chatroomsQueryOptions = webClientORPC.chatroom.getChatrooms.queryOptions();
  const { data: chatrooms } = useQuery({
    ...chatroomsQueryOptions,
    enabled: !!userId,
    refetchOnMount: "always",
  });

  const startChatMutation = useMutation(
    webClientORPC.chatroom.startChatRoom.mutationOptions({
      onSuccess: async (data, variables) => {
        if (userId) {
          queryClient.setQueryData(chatroomsQueryOptions.queryKey, (previous: typeof chatrooms | undefined) => {
            const current = previous ?? [];
            if (current.some((chatroom) => chatroom._id === data.id)) {
              return current;
            }

            return [
              {
                _id: data.id,
                activeParticipantsId: [userId, variables.recipientId],
                pastParticipantsId: [],
                createdAt: new Date(),
              },
              ...current,
            ];
          });
        }

        setActiveChat({ id: data.id, recipientId: variables.recipientId });
        setIsDialogOpen(false);
        setNewChatUsername("");
        setError(null);

        try {
          await queryClient.invalidateQueries({ queryKey: chatroomsQueryOptions.queryKey });
          await queryClient.fetchQuery({
            ...chatroomsQueryOptions,
            staleTime: 0,
          });
        } catch {
          // The optimistic cache update already keeps the sidebar in sync for this create flow.
        }
      },
      onError: (mutationError: unknown) => {
        setError(getErrorMessage(mutationError, "Failed to start chat"));
      },
    })
  );

  const handleStartChat = async () => {
    const username = newChatUsername.trim();
    if (!username) return;
    setError(null);

    try {
      const profile = await queryClient.fetchQuery(
        webClientORPC.profile.getProfileByUsername.queryOptions({
          input: { username },
        })
      );

      if (profile._id === userId) {
        setError("You cannot start a chat with yourself");
        return;
      }

      startChatMutation.mutate({ recipientId: profile._id });
    } catch (profileError) {
      setError(getErrorMessage(profileError, "User not found"));
    }
  };

  const chatroomList = useMemo(() => {
    if (!chatrooms || !userId) return [];
    return chatrooms.map((chatroom) => {
      const recipientId = chatroom.activeParticipantsId.find((id) => id !== userId);
      return {
        chatroomId: chatroom._id,
        recipientId,
      };
    });
  }, [chatrooms, userId]);

  return (
    <ScrollArea className="h-full w-72 border-background border-r bg-background-800/50 font-sans">
      <aside className="flex h-full w-72 flex-col border-background border-r bg-background-800/50 font-sans">
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
          {chatroomList.length === 0 && <p className="mt-8 text-center text-muted-foreground text-sm">No results</p>}
          {chatroomList.map((item) => (
            <ChatroomItem
              key={item.chatroomId}
              chatroomId={item.chatroomId}
              recipientId={item.recipientId}
              isActive={activeId === item.chatroomId}
              onClick={() => setActiveChat({ id: item.chatroomId, recipientId: item.recipientId })}
              search={search}
            />
          ))}
        </nav>
      </aside>
    </ScrollArea>
  );
}

function ChatroomItem({
  chatroomId,
  recipientId,
  isActive,
  onClick,
  search,
}: {
  chatroomId: string;
  recipientId: string | undefined;
  isActive: boolean;
  onClick: () => void;
  search: string;
}) {
  const {
    data: profile,
    isPending,
    isError,
  } = useQuery({
    ...webClientORPC.profile.getProfileById.queryOptions({
      input: { id: recipientId ?? "" },
    }),
    enabled: !!recipientId,
  });

  if (isPending) {
    return (
      <Button
        onClick={onClick}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl px-5 py-6 text-left transition-all",
          isActive ? "bg-accent" : "hover:bg-accent/60"
        )}
        data-chatroom-id={chatroomId}
      >
        <div className="relative shrink-0">
          <Avatar className="h-9 w-9">
            <AvatarFallback>...</AvatarFallback>
          </Avatar>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className={cn("truncate font-medium text-sm", isActive ? "text-foreground" : "text-foreground/90")}>Loading...</span>
          </div>
        </div>
      </Button>
    );
  }

  if (!profile || isError) {
    const fallbackName = recipientId ? `User ${recipientId.slice(0, FALLBACK_ID_PREVIEW_LENGTH)}` : "Unknown user";
    return renderChatroomButton({ fallbackName, isActive, onClick, search });
  }

  if (search && !profile.username.toLowerCase().includes(search.toLowerCase())) {
    return null;
  }

  return (
    <Button
      onClick={onClick}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-3 rounded-xl px-5 py-6 text-left transition-all",
        isActive ? "bg-accent" : "hover:bg-accent/60"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src="https://github.com/shadcn.png" alt={profile.username} />
          <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className={cn("truncate font-medium text-sm", isActive ? "text-foreground" : "text-foreground/90")}>{profile.username}</span>
        </div>
      </div>
    </Button>
  );
}

function renderChatroomButton({
  fallbackName,
  isActive,
  onClick,
  search,
}: {
  fallbackName: string;
  isActive: boolean;
  onClick: () => void;
  search: string;
}) {
  if (search && !fallbackName.toLowerCase().includes(search.toLowerCase())) {
    return null;
  }

  return (
    <Button
      onClick={onClick}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-3 rounded-xl px-5 py-6 text-left transition-all",
        isActive ? "bg-accent" : "hover:bg-accent/60"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarFallback>{fallbackName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className={cn("truncate font-medium text-sm", isActive ? "text-foreground" : "text-foreground/90")}>{fallbackName}</span>
        </div>
      </div>
    </Button>
  );
}
