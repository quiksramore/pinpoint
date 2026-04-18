import type { contextfulPostSchema } from "@pinpoint/contracts";
import { Avatar, AvatarFallback, AvatarImage } from "@pinpoint/shad-ui/components/avatar";
import { Button } from "@pinpoint/shad-ui/components/button";
import type { CarouselApi } from "@pinpoint/shad-ui/components/carousel";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@pinpoint/shad-ui/components/carousel";
import { DialogDescription, DialogHeader, DialogTitle } from "@pinpoint/shad-ui/components/dialog";
import { ScrollArea } from "@pinpoint/shad-ui/components/scroll-area";
import { Separator } from "@pinpoint/shad-ui/components/separator";
import Image from "next/image";
import { useEffect, useState } from "react";
import type z from "zod";
import { env } from "../../../../env";
import { authClientWeb } from "../../../../lib/auth-client-web";
import CommentsDrawer from "./comments-drawer";
import PostOptionsDropdown from "./post-options-dropdown";
import SendToMapButton from "./send-to-map-button";
import UpvoteDownvote from "./upvote-downvote";

export default function PostDialogContent({ postData }: { postData: z.infer<typeof contextfulPostSchema> }) {
  const CAPTION_PREVIEW_LENGTH = 50;
  const [expanded, setExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(1);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const isLong = postData.caption.length > CAPTION_PREVIEW_LENGTH;
  const displayedText = !expanded && isLong ? `${postData.caption.slice(0, CAPTION_PREVIEW_LENGTH)}...` : postData.caption;

  const { data: authData } = authClientWeb.useSession();
  const userId = authData?.user?.id;

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentImageIndex(carouselApi.selectedScrollSnap() + 1);
    };

    onSelect();
    carouselApi.on("select", onSelect);
    carouselApi.on("reInit", onSelect);

    return () => {
      carouselApi.off("select", onSelect);
      carouselApi.off("reInit", onSelect);
    };
  }, [carouselApi]);

  return (
    <ScrollArea className="max-h-[75vh] p-3">
      <div className="relative space-y-4">
        <DialogHeader className="text-center sm:text-center">
          <div className="flex items-center justify-center gap-2">
            <DialogTitle>{postData.title}</DialogTitle>
            <SendToMapButton postLocationData={postData.location} />
          </div>
        </DialogHeader>

        {userId === postData.authorId && <PostOptionsDropdown postId={postData._id} className="absolute top-0 left-0 cursor-pointer" />}

        <Carousel className="group relative" setApi={setCarouselApi}>
          <CarouselContent>
            {postData.images.map((image) => {
              const postURL = `${env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_DEVELOPMENT_URL}/${image.suburl}`;

              return (
                <CarouselItem key={postURL} className="basis-full">
                  <div className="relative aspect-square w-full overflow-hidden rounded-md border border-background-700">
                    <Image src={postURL} alt={postData.title} fill className="object-cover" />
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="left-2 cursor-pointer opacity-0 transition-opacity disabled:opacity-0 group-hover:opacity-100" />
          <CarouselNext className="right-2 cursor-pointer opacity-0 transition-opacity disabled:opacity-0 group-hover:opacity-100" />
          {/* TODO: replace with actual values */}
          <div className="absolute right-2 bottom-2 rounded-md bg-black/50 px-2 py-0.5 text-white text-xs">
            {currentImageIndex}/{postData.images.length}
          </div>
        </Carousel>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {/* TODO: Change SRC to R2 bucket URL */}
            <Avatar className="border border-background-700">
              <AvatarImage src={postData.authorSnapshot?.image} alt={postData.authorSnapshot?.name} />
              <AvatarFallback>{postData.authorSnapshot?.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="truncate">{postData.authorSnapshot?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <CommentsDrawer parentPostID={postData._id} authData={authData} />
            <UpvoteDownvote
              className="bg-background-800"
              postId={postData._id}
              upvotes={postData.metrics.upvotes}
              downvotes={postData.metrics.downvotes}
              initialVote={postData.vote ?? null}
            />
          </div>
        </div>

        <Separator />
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
