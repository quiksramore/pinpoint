import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { Button } from "@pinpoint/shad-ui/components/button";
import { Drawer, DrawerContent, DrawerFooter, DrawerTitle, DrawerTrigger } from "@pinpoint/shad-ui/components/drawer";
import { Input } from "@pinpoint/shad-ui/components/input";
import { ScrollArea } from "@pinpoint/shad-ui/components/scroll-area";
import { Separator } from "@pinpoint/shad-ui/components/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import CommentMessage from "./comment-message";

export default function CommentsDrawer({ parentPostID, authData }: { parentPostID: string; authData: any }) {
  const queryClient = useQueryClient();
  const [commentMessage, setCommentMessage] = useState("");

  const { data: comments } = useQuery(
    webClientORPC.comment.getComments.queryOptions({
      input: {
        postId: parentPostID,
      },
    })
  );

  const createCommentMutation = useMutation({
    ...webClientORPC.comment.addComment.mutationOptions(),
    onError: (error) => {
      console.error("Failed to add comment:", error);
    },
    onSettled: () => {
      // Invalidate comments query to refetch comments after adding a new one
      queryClient.invalidateQueries({
        queryKey: webClientORPC.comment.getComments.queryOptions({
          input: {
            postId: parentPostID,
          },
        }).queryKey,
      });
    },
  });

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <MessageCircle className="cursor-pointer" />
      </DrawerTrigger>
      <DrawerContent className="flex flex-col gap-4 overflow-hidden p-2">
        <DrawerTitle>Comments ({comments?.length})</DrawerTitle>
        <Separator />

        <ScrollArea className="max-h-[83vh]">
          <div className="flex flex-col gap-4">
            {comments?.map((comment) => (
              <CommentMessage key={comment._id} commentData={comment} />
            ))}
          </div>
        </ScrollArea>
        <DrawerFooter>
          <div className="flex items-center gap-2">
            <Avatar className="border border-background-500">
              <AvatarImage src={authData?.user?.image} alt={authData?.user?.name} />
              <AvatarFallback>{authData?.user?.name?.slice(0, 2)}</AvatarFallback>
            </Avatar>

            <Input
              placeholder="Add a comment..."
              value={commentMessage}
              onChange={(e) => setCommentMessage(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim() !== "") {
                  await createCommentMutation.mutateAsync({
                    parentPostId: parentPostID,
                    content: e.currentTarget.value.trim(),
                  });
                  setCommentMessage("");
                }
              }}
            />
            <Button
              onClick={async () => {
                if (commentMessage.trim() !== "") {
                  await createCommentMutation.mutateAsync({
                    parentPostId: parentPostID,
                    content: commentMessage.trim(),
                  });
                  setCommentMessage("");
                }
              }}
              className="cursor-pointer"
            >
              Post
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
