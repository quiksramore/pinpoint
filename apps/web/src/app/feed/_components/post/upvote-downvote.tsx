import type { voteSchema } from "@pinpoint/contracts";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";

type VoteValue = z.infer<typeof voteSchema>["voteValue"];

function getScoreDelta(previousVote: VoteValue | null, nextVote: VoteValue | null) {
  if (previousVote === nextVote) return 0;
  if (previousVote === null && nextVote === "UPVOTE") return 1;
  if (previousVote === null && nextVote === "DOWNVOTE") return -1;
  if (previousVote === "UPVOTE" && nextVote === null) return -1;
  if (previousVote === "DOWNVOTE" && nextVote === null) return 1;
  if (previousVote === "UPVOTE" && nextVote === "DOWNVOTE") return -2;
  if (previousVote === "DOWNVOTE" && nextVote === "UPVOTE") return 2;

  return 0;
}

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
  const [currentVote, setCurrentVote] = useState<VoteValue | null>(initialVote);
  const [score, setScore] = useState(initialScore);

  useEffect(() => {
    setCurrentVote(initialVote);
  }, [initialVote]);

  useEffect(() => {
    setScore(initialScore);
  }, [initialScore]);

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

    const previousVote = currentVote;
    const previousScore = score;

    setCurrentVote(nextVote);
    setScore(previousScore + getScoreDelta(previousVote, nextVote));

    if (nextVote === null) {
      const response = await voteDeleteMutation.mutateAsync({ postId });
      if (!response.success) {
        setCurrentVote(previousVote);
        setScore(previousScore);
      }
      return;
    }

    try {
      await voteAddMutation.mutateAsync({ postId, voteValue: nextVote });
    } catch {
      setCurrentVote(previousVote);
      setScore(previousScore);
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
