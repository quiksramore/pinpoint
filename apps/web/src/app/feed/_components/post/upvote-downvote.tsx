import type { voteSchema } from "@pinpoint/contracts";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";

type VoteValue = z.infer<typeof voteSchema>["voteValue"];

export default function UpvoteDownvote({ postId, upvotes, downvotes }: { postId: string; upvotes?: number; downvotes?: number }) {
  const [currentVote, setCurrentVote] = useState<VoteValue | null>(null);
  const [score, setScore] = useState(0);

  const { data: voteData } = useQuery(
    webClientORPC.vote.getUserVote.queryOptions({
      input: { postId },
    })
  );

  useEffect(() => {
    if (voteData) setCurrentVote(voteData.voteValue);
  }, [voteData]);

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

  const voteAddMutation = useMutation(webClientORPC.vote.addVote.mutationOptions());
  const voteDeleteMutation = useMutation(webClientORPC.vote.deleteVote.mutationOptions());

  useEffect(() => {
    setScore((upvotes || 0) - (downvotes || 0));
  }, [upvotes, downvotes]);

  const handleUpvote = async () => {
    if (currentVote === "UPVOTE") {
      const { success } = await voteDeleteMutation.mutateAsync({ postId });
      if (!success) return;
      setScore((s) => s - 1); // already upvoted
      setCurrentVote(null);
      return;
    }

    if (currentVote === "DOWNVOTE") {
      const success = await voteDeleteMutation.mutateAsync({ postId });
      if (!success) return;
      setScore((s) => s + 2); // remove downvote + add upvote
    } else {
      setScore((s) => s + 1);
    }

    setCurrentVote("UPVOTE");
    const success = await voteAddMutation.mutateAsync({ postId, voteValue: "UPVOTE" });
    if (!success) return;
  };

  const handleDownvote = async () => {
    if (currentVote === "DOWNVOTE") {
      const { success } = await voteDeleteMutation.mutateAsync({ postId });
      if (!success) return;
      setScore((s) => s + 1); // already downvoted
      setCurrentVote(null);
      return;
    }

    if (currentVote === "UPVOTE") {
      const { success } = await voteDeleteMutation.mutateAsync({ postId });
      if (!success) return;
      setScore((s) => s - 2); // remove upvote + add downvote
    } else {
      setScore((s) => s - 1);
    }
    setCurrentVote("DOWNVOTE");

    await voteAddMutation.mutateAsync({
      postId,
      voteValue: "DOWNVOTE",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <ChevronUp onClick={handleUpvote} className={cn("cursor-pointer", currentVote === "UPVOTE" ? "text-green-500" : "")} />
      {score}
      <ChevronDown onClick={handleDownvote} className={cn("cursor-pointer", currentVote === "DOWNVOTE" ? "text-red-500" : "")} />
    </div>
  );
}
