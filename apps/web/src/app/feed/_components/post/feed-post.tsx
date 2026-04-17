import type { contextfulPostSchema } from "@pinpoint/contracts";
import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { Map } from "lucide-react";
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

function getPastelColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 85%)`;
}

export default function FeedPost({ postData, className }: { postData: z.infer<typeof contextfulPostSchema>; className?: string }) {
  return (
    <div
      className={cn("relative flex flex-col items-center justify-center gap-5 rounded-md bg-background p-10 drop-shadow-lg", className)}
      style={{ backgroundColor: getPastelColor(postData._id) }}
    >
      <Image src="/pushpin.png" alt="pin" width={40} height={40} className="absolute top-2" />
      <div className="flex w-full min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 gap-2">
          <Avatar className="shrink-0">
            <AvatarImage src={postData.authorSnapshot?.image} alt={postData.authorSnapshot?.name} />
            <AvatarFallback>{postData.authorSnapshot?.name?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="truncate font-bold text-xl">{postData.authorSnapshot?.name}</span>
        </div>
        <span className="text-foreground-500">{getTimeAgo(postData.createdAt)}</span>
      </div>
      <div className="relative aspect-square w-full overflow-hidden border-5 border-background-700">
        {/* TODO: Change SRC to R2 bucket URL */}
        <Image src="https://picsum.photos/seed/picsum/200/500" alt={postData.title} fill className="!object-center object-cover" />
      </div>
      <div className="w-full">
        <div className="flex w-full items-center justify-between">
          <UpvoteDownvote
            className="bg-background-900/40"
            postId={postData._id}
            upvotes={postData.metrics.upvotes}
            downvotes={postData.metrics.downvotes}
            initialVote={postData.vote ?? null}
          />
          {/* SEND TO MAP */}
          <Map
            onClick={(e) => {
              alert("send to location");
              e.stopPropagation();
            }}
          />
        </div>
      </div>
    </div>
  );
}
