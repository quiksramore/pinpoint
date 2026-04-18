import type { contextfulPostSchema } from "@pinpoint/contracts";
import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import Image from "next/image";
import type z from "zod";
import { env } from "../../../../env";
import { getPastelColor, getTimeAgo } from "../post-grid";
import SendToMapButton from "./send-to-map-button";
import UpvoteDownvote from "./upvote-downvote";

export default function FeedPost({ postData, className }: { postData: z.infer<typeof contextfulPostSchema>; className?: string }) {
  return (
    <div
      className={cn("relative flex flex-col items-center justify-center gap-5 rounded-md bg-background p-10 drop-shadow-lg", className)}
      style={{ backgroundColor: getPastelColor(postData._id) }}
    >
      <Image src="/pushpin.png" alt="pin" width={40} height={40} className="absolute top-2" />
      <div className="flex w-full min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 gap-2">
          <Avatar className="shrink-0 border border-background-700">
            <AvatarImage src={postData.authorSnapshot?.image} alt={postData.authorSnapshot?.name} />
            <AvatarFallback>{postData.authorSnapshot?.name?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="truncate font-bold text-xl">{postData.authorSnapshot?.name}</span>
        </div>
        <span className="text-foreground-500">{getTimeAgo(postData.createdAt)}</span>
      </div>
      <div className="relative aspect-square w-full overflow-hidden border-5 border-background-700">
        {/* TODO: Change SRC to R2 bucket URL */}
        <Image
          // biome-ignore lint/style/noNonNullAssertion: all posts have at least one image
          src={`${env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_DEVELOPMENT_URL}/${postData.images[0]!.suburl}`}
          alt={postData.title}
          fill
          className="object-cover"
        />
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
          <SendToMapButton postLocationData={postData.location} />
        </div>
      </div>
    </div>
  );
}
