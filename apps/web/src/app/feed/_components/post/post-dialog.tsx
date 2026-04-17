import type { voteSchema } from "@pinpoint/contracts";
import { Dialog, DialogContent, DialogTrigger } from "@pinpoint/shad-ui/components/dialog";
import type z from "zod";
import type { postSchema } from "../../../../../../../packages/contracts/src/http/posts/post-schema";
import FeedPost from "./feed-post";
import PostDialogContent from "./post-dialog-content";

type PostDialogData = z.infer<typeof postSchema> & {
  vote?: z.infer<typeof voteSchema>["voteValue"];
};

export default function PostDialog({ data }: { data: PostDialogData }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          <FeedPost data={data} />
        </div>
      </DialogTrigger>
      <DialogContent className="mx-auto w-full max-w-2xl">
        <PostDialogContent data={data} />
      </DialogContent>
    </Dialog>
  );
}
