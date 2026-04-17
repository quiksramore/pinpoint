import type { commentSchema } from "@pinpoint/contracts";
import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import type z from "zod";

export default function CommentMessage({ commentData }: { commentData: z.infer<typeof commentSchema> }) {
  return (
    <div className="flex w-full gap-2">
      <Avatar>
        <AvatarImage src={commentData.authorSnapshot?.image} alt={commentData.authorSnapshot?.name} />
        <AvatarFallback>{commentData.authorSnapshot?.name?.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex w-full flex-col gap-2">
        <div className="w-full rounded-md bg-background-800 p-2">
          <p className="wrap-anywhere">{commentData.content}</p>
        </div>
      </div>
    </div>
  );
}
