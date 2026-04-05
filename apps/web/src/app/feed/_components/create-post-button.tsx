import { Dialog, DialogContent, DialogHeader, DialogTrigger, DialogTitle, DialogDescription } from "@pinpoint/shad-ui/components/dialog";
import CreatePostForm from "./create-post-form";
import { Button } from "@pinpoint/shad-ui/components/button";
import { Card, CardDescription, CardTitle } from "@pinpoint/shad-ui/components/card";

export default function CreatePostButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-full">Create Post</Button>
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
