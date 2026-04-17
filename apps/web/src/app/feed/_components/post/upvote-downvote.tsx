import type { voteSchema } from "@pinpoint/contracts";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import { useVoteStore } from "./vote-store";

type VoteValue = z.infer<typeof voteSchema>["voteValue"];

// TODO check optimistic approach
export default function UpvoteDownvote({
  postId,
  upvotes,
  downvotes,
  initialVote = null,
  className,
}: {
  postId: string;
  upvotes?: number;
  downvotes?: number;
  initialVote?: VoteValue | null;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const initialScore = (upvotes || 0) - (downvotes || 0);
  const ensurePost = useVoteStore((state) => state.ensurePost);
  const setFromServer = useVoteStore((state) => state.setFromServer);
  const applyOptimistic = useVoteStore((state) => state.applyOptimistic);
  const rollback = useVoteStore((state) => state.rollback);
  const voteState = useVoteStore((state) => state.byPostId[postId]);
  const currentVote = voteState?.currentVote ?? initialVote;
  const score = voteState?.score ?? initialScore;

  useEffect(() => {
    ensurePost(postId, initialVote, initialScore);
  }, [ensurePost, postId, initialVote, initialScore]);

  useEffect(() => {
    setFromServer(postId, initialVote, initialScore);
  }, [setFromServer, postId, initialVote, initialScore]);

  const voteAddMutation = useMutation({
    ...webClientORPC.vote.addVote.mutationOptions(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: webClientORPC.posts.getAllPosts.queryOptions({ input: {} }).queryKey });
    },
  });

  const voteDeleteMutation = useMutation({
    ...webClientORPC.vote.deleteVote.mutationOptions(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: webClientORPC.posts.getAllPosts.queryOptions({ input: {} }).queryKey });
    },
  });

  const applyVoteChange = async (nextVote: VoteValue | null) => {
    if (voteDeleteMutation.isPending || voteAddMutation.isPending) return;

    const previous = applyOptimistic(postId, nextVote);

    if (nextVote === null) {
      const response = await voteDeleteMutation.mutateAsync({ postId });
      if (!response.success) {
        rollback(postId, previous);
      }
      return;
    }

    try {
      await voteAddMutation.mutateAsync({ postId, voteValue: nextVote });
    } catch {
      rollback(postId, previous);
    }
  };

  const handleUpvote = async () => {
    if (currentVote === "UPVOTE") {
      await applyVoteChange(null);
      return;
    }

    await applyVoteChange("UPVOTE");
  };

  const handleDownvote = async () => {
    if (currentVote === "DOWNVOTE") {
      await applyVoteChange(null);
      return;
    }

    await applyVoteChange("DOWNVOTE");
  };

  return (
    <div className={cn("flex items-center gap-2 rounded-full p-2", className)}>
      <ChevronUp
        onClick={async (e) => {
          e.stopPropagation(); // prevent event bubbling to parent elements (e.g., opening post dialog)
          await handleUpvote();
        }}
        className={cn("cursor-pointer", currentVote === "UPVOTE" ? "text-green-500" : "")}
      />
      {score}
      <ChevronDown
        onClick={async (e) => {
          e.stopPropagation(); // prevent event bubbling to parent elements (e.g., opening post dialog)
          await handleDownvote();
        }}
        className={cn("cursor-pointer", currentVote === "DOWNVOTE" ? "text-red-500" : "")}
      />
    </div>
  );
}

// TODO investigate validity?
// const voteAddMutation = useMutation({
//   mutationFn: (voteValue: VoteValue) =>
//     webClientORPC.vote.addVote.call({
//       postId,
//       voteValue,
//     }),
// });

// const voteDeleteMutation = useMutation({
//   mutationFn: () => {
//     if (!voteId) {
//       throw new Error("Cannot delete vote without vote id");
//     }
//
//     return webClientORPC.vote.deleteVote.call({
//       postId,
//     });
//   },
// });

// const voteAddMutation = useMutation(webClientORPC.vote.addVote.mutationOptions());
