"use client";

import { Button } from "@pinpoint/shad-ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@pinpoint/shad-ui/components/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import CreatePostForm from "./form/create-post-form";

export default function CreatePostDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)} className="fixed right-8 bottom-8 z-10 size-15 cursor-pointer rounded-full p-0">
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
        <CreatePostForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
