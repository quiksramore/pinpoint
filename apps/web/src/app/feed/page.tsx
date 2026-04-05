import { Button } from "@pinpoint/shad-ui/components/button";
import CreatePostButton from "./_components/create-post-button";
import { Textarea } from "@pinpoint/shad-ui/components/textarea";

export default function Page() {
  return (
    <main>
      <CreatePostButton />
      {/* <Textarea className=" w-1/2" /> */}
    </main>
  );
}
