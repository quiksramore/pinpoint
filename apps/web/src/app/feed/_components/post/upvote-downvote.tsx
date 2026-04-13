import { cn } from "@pinpoint/shad-ui/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { webClientORPC } from "../../../../lib/orpc-web-client";

type Vote = "up" | "down" | null;
type VoteValue = 1 | -1;

export default function UpvoteDownvote({
  upvotes,
  downvotes,
  postId,
}: {
  upvotes?: number;
  downvotes?: number;
  postId: string;
  userId: string;
}) {
  const [vote, setVote] = useState<Vote>(null);
  const [score, setScore] = useState(0);
  const [voteId, setVoteId] = useState<string | null>(null);

  const { data: voteData } = useQuery(
    webClientORPC.posts.getUserVote.queryOptions({
      input: {
        postId,
      },
    })
  );

  useEffect(() => {
    if (voteData) {
      setVote(voteData.voteValue === 1 ? "up" : "down");
      setVoteId(voteData._id);
    }
  }, [voteData]);

  const voteMutation = useMutation({
    mutationFn: (voteValue: VoteValue) =>
      webClientORPC.posts.addVote.call({
        postId,
        voteValue,
      }),
  });

  const voteDeleteMutation = useMutation({
    mutationFn: () => {
      if (!voteId) {
        throw new Error("Cannot delete vote without vote id");
      }

      return webClientORPC.posts.deleteVote.call({
        // TODO: make error handling
        id: voteId as string,
      });
    },
  });

  useEffect(() => {
    setScore((upvotes || 0) - (downvotes || 0));
  }, [upvotes, downvotes]);

  const handleUpvote = async () => {
    if (vote === "up") {
      const success = await voteDeleteMutation.mutateAsync();
      if (!success) return;
      setScore((s) => s - 1); // already upvoted
      setVote(null);
      return;
    }

    if (vote === "down") {
      const success = await voteDeleteMutation.mutateAsync();
      if (!success) return;
      setScore((s) => s + 2); // remove downvote + add upvote
    } else {
      setScore((s) => s + 1);
    }
    setVote("up");
    const success = await voteMutation.mutateAsync(1);
    if (!success) return;
    setVoteId(success.id);
  };

  const handleDownvote = async () => {
    if (vote === "down") {
      const success = await voteDeleteMutation.mutateAsync();
      if (!success) return;
      setScore((s) => s + 1); // already downvoted
      setVote(null);
      return;
    }

    if (vote === "up") {
      const success = await voteDeleteMutation.mutateAsync();
      if (!success) return;
      setScore((s) => s - 2); // remove upvote + add downvote
    } else {
      setScore((s) => s - 1);
    }
    const success = await voteMutation.mutateAsync(-1);
    if (!success) return;
    setVoteId(success.id);
    setVote("down");
  };

  return (
    <div className="flex items-center gap-2">
      <ChevronUp onClick={handleUpvote} className={cn("cursor-pointer", vote === "up" ? "text-green-500" : "")} />
      {score}
      <ChevronDown onClick={handleDownvote} className={cn("cursor-pointer", vote === "down" ? "text-red-500" : "")} />
    </div>
  );
}
