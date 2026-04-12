import { cn } from "@pinpoint/shad-ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { webClientORPC } from "../../../../lib/orpc-web-client";

type Vote = 1 | -1 | null;

export default function UpvoteDownvote({ upvotes, downvotes, postId }: { upvotes?: number; downvotes?: number; postId: string }) {
  const [vote, setVote] = useState<Vote>(null);
  const [score, setScore] = useState(0);

  const voteMutation = useMutation({
    mutationFn: (voteValue: Vote) =>
      webClientORPC.posts.addVote.call({
        authorId: "123",
        postId,
        voteValue,
      }),
  });

  useEffect(() => {
    setScore((upvotes || 0) - (downvotes || 0));
  }, [upvotes, downvotes]);

  const handleUpvote = () => {
    if (vote === 1) {
      setScore((s) => s - 1); // already upvoted
      setVote(null);
      return;
    }

    if (vote === -1) {
      setScore((s) => s + 2); // remove downvote + add upvote
    } else {
      setScore((s) => s + 1);
    }

    setVote(1);
  };

  const handleDownvote = () => {
    if (vote === -1) {
      setScore((s) => s + 1); // already downvoted
      setVote(null);
      return;
    }

    if (vote === 1) {
      setScore((s) => s - 2); // remove upvote + add downvote
    } else {
      setScore((s) => s - 1);
    }

    setVote(-1);
  };

  return (
    <div className="flex items-center gap-2">
      <ChevronUp onClick={handleUpvote} className={cn("cursor-pointer", vote === 1 ? "text-green-500" : "")} />
      {score}
      <ChevronDown onClick={handleDownvote} className={cn("cursor-pointer", vote === -1 ? "text-red-500" : "")} />
    </div>
  );
}
