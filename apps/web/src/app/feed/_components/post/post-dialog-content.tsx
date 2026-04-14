import { DialogDescription, DialogHeader, DialogTitle } from "@pinpoint/shad-ui/components/dialog";
import type z from "zod";
import type { postSchema } from "../../../../../../../packages/contracts/src/http/posts/post-schema";
import UpvoteDownvote from "./upvote-downvote";

export default function PostDialogContent({ data }: { data: z.infer<typeof postSchema> }) {
  return (
    <DialogHeader>
      <DialogTitle>{data.title}</DialogTitle>
      <DialogDescription>{data.caption}</DialogDescription>
      <UpvoteDownvote postId={data._id} upvotes={data.metrics.upvotes} downvotes={data.metrics.downvotes} />
    </DialogHeader>
  );
}
