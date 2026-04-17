import type { contextfulPostSchema } from "@pinpoint/contracts";
import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { MessageCircle } from "lucide-react";
import Image from "next/image";
import type z from "zod";
import UpvoteDownvote from "./upvote-downvote";

export function getTimeAgo(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function FeedPost({ postData, className }: { postData: z.infer<typeof contextfulPostSchema>; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-5 rounded-md bg-background p-10 drop-shadow-lg", className)}>
      <div className="flex w-full min-w-0 items-center justify-between gap-2">
        <div className="flex gap-2">
          <Avatar>
            <AvatarImage src={postData.authorSnapshot?.image} alt={postData.authorSnapshot?.name} />
            <AvatarFallback>{postData.authorSnapshot?.name?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="truncate font-bold text-xl">{postData.authorSnapshot?.name}</span>
        </div>
        <span className="text-foreground-500">{getTimeAgo(postData.createdAt)}</span>
      </div>
      <div className="relative aspect-square w-full overflow-hidden border-5 border-background-700">
        {/* TODO: Change SRC to R2 bucket URL */}
        <Image src="https://picsum.photos/seed/picsum/200/300" alt={postData.title} fill className="object-cover" />
      </div>
      <div className="flex w-full items-center justify-between">
        <UpvoteDownvote
          className="bg-background-900/40"
          postId={postData._id}
          upvotes={postData.metrics.upvotes}
          downvotes={postData.metrics.downvotes}
          initialVote={postData.vote ?? null}
        />
        {/* <CommentsDrawer parentPostID={postData._id} /> */}
        <MessageCircle className="cursor-pointer" />
      </div>
      {/* <p>{postData.title}</p>
      <div className="relative aspect-square w-full overflow-hidden border-5 border-background-700">
      {/* TODO: Change SRC to R2 bucket URL
        <Image src="https://picsum.photos/seed/picsum/200/300" alt={postData.title} fill className="object-cover" />
      </div>
      <div className="flex w-full justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar>
            <AvatarImage src={postData.authorSnapshot?.image} alt={postData.authorSnapshot?.name} />
            <AvatarFallback>{postData.authorSnapshot?.name?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="truncate">{postData.authorSnapshot?.name}</span>
        </div>
        <UpvoteDownvote
          className="bg-background-900/40"
          postId={postData._id}
          upvotes={postData.metrics.upvotes}
          downvotes={postData.metrics.downvotes}
          initialVote={postData.vote ?? null}
        />
      </div> */}
    </div>
  );
}
