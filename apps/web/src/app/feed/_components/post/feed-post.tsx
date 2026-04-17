import type { contextfulPostSchema } from "@pinpoint/contracts";
import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { MessageCircle } from "lucide-react";
import Image from "next/image";
import type z from "zod";
import UpvoteDownvote from "./upvote-downvote";

export function getTimeAgo(date: Date) {
  const diff = Date.now() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
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
        <Image src="https://picsum.photos/seed/picsum/200/500" alt={postData.title} fill className="object-cover" />
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
