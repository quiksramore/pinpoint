"use client";

import { Button } from "@pinpoint/shad-ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@pinpoint/shad-ui/components/dialog";
import { Plus } from "lucide-react";
import CreatePostForm from "./form/create-post-form";

export default function CreatePostDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="fixed right-8 bottom-8 size-15 cursor-pointer rounded-full p-0">
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full">
        {/* <Card>
            <CardTitle>Create Post</CardTitle>
            <CardDescription>Create a New Post!</CardDescription>
        </Card> */}
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>Create a New Post!</DialogDescription>
        </DialogHeader>
        <CreatePostForm />
      </DialogContent>
    </Dialog>
  );
}
