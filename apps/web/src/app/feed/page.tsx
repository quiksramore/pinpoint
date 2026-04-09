import Header from "../_components/header";
import CreatePostDialog from "./_components/create-post-dialog";

export default function Page() {
  return (
    <main className="min-h-screen bg-background-900">
      <Header defaultValue="feed" />
      <CreatePostDialog />
      {/* <Textarea className=" w-1/2" /> */}
    </main>
  );
}
