import type { voteSchema } from "@pinpoint/contracts";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect } from "react";
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

export default function UpvoteDownvote({ postId, upvotes, downvotes }: { postId: string; upvotes?: number; downvotes?: number }) {
  const queryClient = useQueryClient();
  const initialScore = (upvotes || 0) - (downvotes || 0);
  const voteQueryKey = webClientORPC.vote.getUserVote.queryKey({ input: { postId } });
  const currentVoteQueryKey = ["post-current-vote", postId] as const;
  const scoreQueryKey = ["post-vote-score", postId] as const;

  // TODO: create a useStore() for these states to ensure syncronization across components (e.g., post dialog + feed post)
  const { data: voteData } = useQuery(
    webClientORPC.vote.getUserVote.queryOptions({
      input: { postId },
    })
  );

  const { data: currentVote = null } = useQuery({
    queryKey: currentVoteQueryKey,
    queryFn: () => (voteData?.voteValue ?? null) as VoteValue | null,
    initialData: (voteData?.voteValue ?? null) as VoteValue | null,
  });

  const { data: score = initialScore } = useQuery({
    queryKey: scoreQueryKey,
    queryFn: () => initialScore,
    initialData: initialScore,
  });

  useEffect(() => {
    queryClient.setQueryData<VoteValue | null>(currentVoteQueryKey, voteData?.voteValue ?? null);
  }, [queryClient, postId, voteData?.voteValue]);

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

  const voteAddMutation = useMutation({
    ...webClientORPC.vote.addVote.mutationOptions(),
    onMutate: async (newVote) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: voteQueryKey });

      // Snapshot the previous value
      const previousVote = queryClient.getQueryData<VoteValue | null>(currentVoteQueryKey) ?? null;
      const previousScore = queryClient.getQueryData<number>(scoreQueryKey) ?? initialScore;

      // Optimistically update to the new value
      queryClient.setQueryData<VoteValue | null>(currentVoteQueryKey, newVote.voteValue);

      queryClient.setQueryData<number>(scoreQueryKey, previousScore + getScoreDelta(previousVote, newVote.voteValue));

      return { previousVote, previousScore };
    },
    onError: (err, newVote, context) => {
      // Rollback to the previous value on error
      queryClient.setQueryData(currentVoteQueryKey, context?.previousVote ?? null);
      queryClient.setQueryData(scoreQueryKey, context?.previousScore ?? initialScore);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure synchronization
      queryClient.invalidateQueries({ queryKey: voteQueryKey });
    },
  });

  // Repeat similar pattern for voteDeleteMutation (setting voteValue to null optimistically)

  const voteDeleteMutation = useMutation({
    ...webClientORPC.vote.deleteVote.mutationOptions(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: voteQueryKey });

      const previousVote = queryClient.getQueryData<VoteValue | null>(currentVoteQueryKey) ?? null;
      const previousScore = queryClient.getQueryData<number>(scoreQueryKey) ?? initialScore;

      queryClient.setQueryData<VoteValue | null>(currentVoteQueryKey, null);
      queryClient.setQueryData<number>(scoreQueryKey, previousScore + getScoreDelta(previousVote, null));

      return { previousVote, previousScore };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(currentVoteQueryKey, context?.previousVote ?? null);
      queryClient.setQueryData(scoreQueryKey, context?.previousScore ?? initialScore);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: voteQueryKey });
    },
  });

  useEffect(() => {
    queryClient.setQueryData<number>(scoreQueryKey, initialScore);
  }, [queryClient, postId, initialScore]);

  const handleUpvote = async () => {
    if (voteDeleteMutation.isPending || voteAddMutation.isPending) return; // prevent multiple rapid clicks
    if (currentVote === "UPVOTE") {
      const { success } = await voteDeleteMutation.mutateAsync({ postId });
      if (!success) return;
      return;
    }

    const success = await voteAddMutation.mutateAsync({ postId, voteValue: "UPVOTE" });
    if (!success) return;
  };

  const handleDownvote = async () => {
    if (voteDeleteMutation.isPending || voteAddMutation.isPending) return; // prevent multiple rapid clicks
    if (currentVote === "DOWNVOTE") {
      const { success } = await voteDeleteMutation.mutateAsync({ postId });
      if (!success) return;
      return;
    }

    const success = await voteAddMutation.mutateAsync({
      postId,
      voteValue: "DOWNVOTE",
    });
    if (!success) return;
  };

  return (
    <div className="flex items-center gap-2">
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
