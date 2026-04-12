import type { postSchema } from "@pinpoint/contracts";
import Image from "next/image";
import type z from "zod";
import UpvoteDownvote from "./upvote-downvote";
export default function FeedPost({ data }: { data: z.infer<typeof postSchema> }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 bg-background-800 p-10">
      <p>{data.title}</p>
      <div className="relative aspect-square w-full overflow-hidden border-5 border-background-700">
        <Image src="https://picsum.photos/seed/picsum/200/300" alt={data.title} fill className="object-cover" />
      </div>
      <div className="flex w-full justify-between">
        <div className="flex items-center gap-2">
          {/* TODO: Change SRC to R2 bucket URL */}
          <div className="relative h-7 w-7 overflow-hidden rounded-full">
            <Image src="https://picsum.photos/seed/picsum/200/300" alt={data.authorSnapshot?.name} fill className="object-cover" />
          </div>
          <span>{data.authorSnapshot?.name}</span>
        </div>
        <UpvoteDownvote postId={data._id} upvotes={data.metrics.upvotes} downvotes={data.metrics.downvotes} />
      </div>
    </div>
  );
}
