import { Dialog, DialogContent, DialogTrigger } from "@pinpoint/shad-ui/components/dialog";
import type z from "zod";
import type { contextfulPostSchema } from "../../../../../../../packages/contracts/src/http/posts/post-schema";
import FeedPost from "./feed-post";
import PostDialogContent from "./post-dialog-content";

export default function PostDialog({ postData }: { postData: z.infer<typeof contextfulPostSchema> }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          <FeedPost postData={postData} />
        </div>
      </DialogTrigger>
      <DialogContent className="mx-auto w-full max-w-2xl">
        <PostDialogContent postData={postData} />
      </DialogContent>
    </Dialog>
  );
}
