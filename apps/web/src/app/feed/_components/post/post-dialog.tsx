import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@pinpoint/shad-ui/components/dialog";
import type z from "zod";
import type { postSchema } from "../../../../../../../packages/contracts/src/http/posts/post-schema";
import FeedPost from "./feed-post";

export default function PostDialog({ data }: { data: z.infer<typeof postSchema> }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          <FeedPost data={data} />
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{data.title}</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
