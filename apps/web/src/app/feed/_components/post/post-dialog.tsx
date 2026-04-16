import { Dialog, DialogContent, DialogTrigger } from "@pinpoint/shad-ui/components/dialog";
import type z from "zod";
import type { postSchema } from "../../../../../../../packages/contracts/src/http/posts/post-schema";
import FeedPost from "./feed-post";
import PostDialogContent from "./post-dialog-content";

export default function PostDialog({ data }: { data: z.infer<typeof postSchema> }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          <FeedPost data={data} />
        </div>
      </DialogTrigger>
      <DialogContent className="mx-auto max-h-[75vh] w-full max-w-2xl">
        <PostDialogContent data={data} />
      </DialogContent>
    </Dialog>
  );
}
