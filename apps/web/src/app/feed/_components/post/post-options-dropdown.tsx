import { Button } from "@pinpoint/shad-ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@pinpoint/shad-ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ellipsis } from "lucide-react";
import { webClientORPC } from "../../../../lib/orpc-web-client";

export default function PostOptionsDropdown({ postId, className }: { postId: string; className?: string }) {
  const queryClient = useQueryClient();

  const deletePostMutation = useMutation({
    ...webClientORPC.posts.deletePost.mutationOptions(),
    onError: (error) => {
      console.error("Failed to delete post:", error);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: webClientORPC.posts.getAllPosts.queryOptions({ input: {} }).queryKey,
      });
    },
  });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Ellipsis className={className} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Button variant="destructive" className="w-full cursor-pointer" onClick={() => deletePostMutation.mutate({ id: postId })}>
            Delete Post
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
