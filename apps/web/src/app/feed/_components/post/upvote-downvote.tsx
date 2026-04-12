import { cn } from "@pinpoint/shad-ui/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { webClientORPC } from "../../../../lib/orpc-web-client";

type Vote = "up" | "down" | null;
type VoteValue = 1 | -1;

export default function UpvoteDownvote({ upvotes, downvotes, postId }: { upvotes?: number; downvotes?: number; postId: string }) {
  const [vote, setVote] = useState<Vote>(null);
  const [score, setScore] = useState(0);

  const { data: voteData } = useQuery(
    webClientORPC.posts.getUserVote.queryOptions({
      input: postId,
    })
  );

  const voteMutation = useMutation({
    mutationFn: (voteValue: VoteValue) =>
      webClientORPC.posts.addVote.call({
        authorId: "123",
        postId,
        voteValue,
      }),
  });

  const voteDeleteMutation = useMutation({
    mutationFn: () =>
      webClientORPC.posts.deleteVote.call({
        // TODO: make error handling
        _id: voteData._id,
      }),
  });

  useEffect(() => {
    setScore((upvotes || 0) - (downvotes || 0));
  }, [upvotes, downvotes]);

  const handleUpvote = () => {
    if (vote === "up") {
      setScore((s) => s - 1); // already upvoted
      setVote(null);
      voteDeleteMutation.mutate();
      return;
    }

    if (vote === "down") {
      setScore((s) => s + 2); // remove downvote + add upvote
      voteDeleteMutation.mutate();
    } else {
      setScore((s) => s + 1);
    }
    voteMutation.mutate(1);
    setVote("up");
  };

  const handleDownvote = () => {
    if (vote === "down") {
      setScore((s) => s + 1); // already downvoted
      setVote(null);
      voteDeleteMutation.mutate();
      return;
    }

    if (vote === "up") {
      setScore((s) => s - 2); // remove upvote + add downvote
      voteDeleteMutation.mutate();
    } else {
      setScore((s) => s - 1);
    }
    voteMutation.mutate(-1);
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
