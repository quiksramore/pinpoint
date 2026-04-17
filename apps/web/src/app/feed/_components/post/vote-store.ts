import type { voteSchema } from "@pinpoint/contracts";
import type z from "zod";
import { create } from "zustand";

type VoteValue = z.infer<typeof voteSchema>["voteValue"];

type VoteState = {
  currentVote: VoteValue | null;
  score: number;
  isDirty: boolean;
};

type VoteStoreState = {
  byPostId: Record<string, VoteState>;
  ensurePost: (postId: string, initialVote: VoteValue | null, initialScore: number) => void;
  setFromServer: (postId: string, vote: VoteValue | null, score: number) => void;
  applyOptimistic: (postId: string, nextVote: VoteValue | null) => VoteState;
  rollback: (postId: string, previous: VoteState) => void;
};

export const useVoteStore = create<VoteStoreState>((set, get) => ({
  byPostId: {},
  ensurePost: (postId, initialVote, initialScore) => {
    const existing = get().byPostId[postId];
    if (existing) return;

    set((state) => ({
      byPostId: {
        ...state.byPostId,
        [postId]: {
          currentVote: initialVote,
          score: initialScore,
          isDirty: false,
        },
      },
    }));
  },
  setFromServer: (postId, vote, score) => {
    const existing = get().byPostId[postId];
    if (existing?.isDirty && (existing.currentVote !== vote || existing.score !== score)) {
      return;
    }

    set((state) => ({
      byPostId: {
        ...state.byPostId,
        [postId]: {
          currentVote: vote,
          score,
          isDirty: false,
        },
      },
    }));
  },
  applyOptimistic: (postId, nextVote) => {
    const previous = get().byPostId[postId] ?? { currentVote: null, score: 0, isDirty: false };
    const nextScore = previous.score + getScoreDelta(previous.currentVote, nextVote);

    set((state) => ({
      byPostId: {
        ...state.byPostId,
        [postId]: {
          currentVote: nextVote,
          score: nextScore,
          isDirty: true,
        },
      },
    }));

    return previous;
  },
  rollback: (postId, previous) => {
    set((state) => ({
      byPostId: {
        ...state.byPostId,
        [postId]: previous,
      },
    }));
  },
}));

export function getScoreDelta(previousVote: VoteValue | null, nextVote: VoteValue | null) {
  if (previousVote === nextVote) return 0;
  if (previousVote === null && nextVote === "UPVOTE") return 1;
  if (previousVote === null && nextVote === "DOWNVOTE") return -1;
  if (previousVote === "UPVOTE" && nextVote === null) return -1;
  if (previousVote === "DOWNVOTE" && nextVote === null) return 1;
  if (previousVote === "UPVOTE" && nextVote === "DOWNVOTE") return -2;
  if (previousVote === "DOWNVOTE" && nextVote === "UPVOTE") return 2;

  return 0;
}
