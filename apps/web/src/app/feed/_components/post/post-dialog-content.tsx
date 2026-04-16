import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@pinpoint/shad-ui/components/carousel";
import { DialogDescription, DialogHeader, DialogTitle } from "@pinpoint/shad-ui/components/dialog";
import Image from "next/image";
import type z from "zod";
import type { postSchema } from "../../../../../../../packages/contracts/src/http/posts/post-schema";
import UpvoteDownvote from "./upvote-downvote";

export default function PostDialogContent({ data }: { data: z.infer<typeof postSchema> }) {
  return (
    <div className="space-y-4">
      <DialogHeader className="text-center sm:text-center">
        <DialogTitle>{data.title}</DialogTitle>
      </DialogHeader>

      <Carousel className="mx-10">
        <CarouselContent>
          {/* Map from data.images and set correct src */}
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index} className="basis-full">
              <div className="relative aspect-square w-full overflow-hidden rounded-md border border-background-700">
                <Image src="https://picsum.photos/seed/picsum/200/300" alt={data.title} fill className="object-cover" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="cursor-pointer" />
        <CarouselNext className="cursor-pointer" />
      </Carousel>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {/* TODO: Change SRC to R2 bucket URL */}
          <Avatar>
            <AvatarImage src={data.authorSnapshot?.image} alt={data.authorSnapshot?.name} />
            <AvatarFallback>{data.authorSnapshot?.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="truncate">{data.authorSnapshot?.name}</span>
        </div>
        <UpvoteDownvote postId={data._id} upvotes={data.metrics.upvotes} downvotes={data.metrics.downvotes} />
      </div>

      {/* <Separator /> */}

      <DialogDescription className="text-foreground">{data.caption}</DialogDescription>
    </div>
  );
}
