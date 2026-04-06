import { Button } from "@pinpoint/shad-ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@pinpoint/shad-ui/components/dialog";
import CreatePostForm from "./form/create-post-form";

export default function CreatePostDialog() {
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
