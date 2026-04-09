"use client";

import { Button } from "@pinpoint/shad-ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@pinpoint/shad-ui/components/dialog";
import CreatePostForm from "./form/create-post-form";
import { Plus } from "lucide-react";

export default function CreatePostDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="cursor-pointer fixed right-8 bottom-8 size-15 rounded-full p-0">
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
