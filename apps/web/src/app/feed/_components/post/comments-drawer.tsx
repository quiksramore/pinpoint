import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@pinpoint/shad-ui/components/drawer";
import { Input } from "@pinpoint/shad-ui/components/input";
import { Separator } from "@pinpoint/shad-ui/components/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { webClientORPC } from "../../../../lib/orpc-web-client";

export default function CommentsDrawer({ parentPostID }: { parentPostID: string }) {
  const queryClient = useQueryClient();

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
  //   const { data, isLoading, error } = useQuery(
  //       webClientORPC.posts.getAllPosts.queryOptions({
  //         input: {},
  //       })
  //     );

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <MessageCircle className="cursor-pointer" />
      </DrawerTrigger>
      <DrawerContent className="flex flex-col gap-4 p-2">
        <DrawerTitle>Comments</DrawerTitle>
        <Separator />
        <Input
          placeholder="Add a comment..."
          onKeyDown={async (e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim() !== "") {
              console.log("parentPostID:", parentPostID);
              await createCommentMutation.mutateAsync({
                parentPostId: parentPostID,
                content: e.currentTarget.value.trim(),
              });
              e.currentTarget.value = "";
            }
          }}
        />
        {comments?.map((comment) => (
          <div key={comment._id} className="rounded-md bg-background-800 p-2">
            <p>{comment.content}</p>
          </div>
        ))}
      </DrawerContent>
    </Drawer>
  );
}
