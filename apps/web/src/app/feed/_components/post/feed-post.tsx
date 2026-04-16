import type { postSchema } from "@pinpoint/contracts";
import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import Image from "next/image";
import type z from "zod";
import UpvoteDownvote from "./upvote-downvote";
export default function FeedPost({ data, className }: { data: z.infer<typeof postSchema>; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-5 bg-background-800 p-10", className)}>
      <p>{data.title}</p>
      <div className="relative aspect-square w-full overflow-hidden border-5 border-background-700">
        <Image src="https://picsum.photos/seed/picsum/200/300" alt={data.title} fill className="object-cover" />
      </div>
      <div className="flex w-full justify-between">
        <div className="flex min-w-0 items-center gap-2">
          {/* TODO: Change SRC to R2 bucket URL */}
          <Avatar>
            <AvatarImage src={data.authorSnapshot?.image} alt={data.authorSnapshot?.name} />
            <AvatarFallback>{data.authorSnapshot?.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="truncate">{data.authorSnapshot?.name}</span>
        </div>
        <UpvoteDownvote className="bg-background-900/40" postId={data._id} upvotes={data.metrics.upvotes} downvotes={data.metrics.downvotes} />
      </div>
    </div>
  );
}
