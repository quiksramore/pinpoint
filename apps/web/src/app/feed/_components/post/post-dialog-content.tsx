import type { voteSchema } from "@pinpoint/contracts";
import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { Button } from "@pinpoint/shad-ui/components/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@pinpoint/shad-ui/components/carousel";
import { DialogDescription, DialogHeader, DialogTitle } from "@pinpoint/shad-ui/components/dialog";
import { ScrollArea } from "@pinpoint/shad-ui/components/scroll-area";
import Image from "next/image";
import { useState } from "react";
import type z from "zod";
import type { postSchema } from "../../../../../../../packages/contracts/src/http/posts/post-schema";
import UpvoteDownvote from "./upvote-downvote";

type PostDialogData = z.infer<typeof postSchema> & {
  vote?: z.infer<typeof voteSchema>["voteValue"];
};

export default function PostDialogContent({ data }: { data: PostDialogData }) {
  const CAPTION_PREVIEW_LENGTH = 50;
  const [expanded, setExpanded] = useState(false);
  const isLong = data.caption.length > CAPTION_PREVIEW_LENGTH;

  const displayedText = !expanded && isLong ? `${data.caption.slice(0, CAPTION_PREVIEW_LENGTH)}...` : data.caption;
  return (
    <ScrollArea className="max-h-[75vh]">
      <div className="space-y-4">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle>{data.title}</DialogTitle>
        </DialogHeader>

        <Carousel className="mx-12">
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
          <UpvoteDownvote
            className="bg-background-800"
            postId={data._id}
            upvotes={data.metrics.upvotes}
            downvotes={data.metrics.downvotes}
            initialVote={data.vote ?? null}
          />
        </div>

        {/* <Separator /> */}
        <div>
          <DialogTitle className="text-sm">Caption</DialogTitle>
          <div className="flex flex-wrap items-end gap-1">
            <DialogDescription className="whitespace-normal break-words break-all text-foreground">{displayedText}</DialogDescription>

            {isLong && (
              <Button
                variant="link"
                onClick={() => setExpanded((v) => !v)}
                className="h-auto cursor-pointer p-0 text-blue-500 text-sm hover:underline"
              >
                {expanded ? "Show less" : "Show more"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
