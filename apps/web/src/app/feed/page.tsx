import Header from "../_components/header";
import CreatePostDialog from "./_components/create-post-dialog";
import PostGrid from "./_components/post-grid";

export default function Page() {
  return (
    <main className="min-h-screen bg-background-800">
      <Header defaultValue="feed" />
      <CreatePostDialog />
      <PostGrid />
      {/* <Textarea className=" w-1/2" /> */}
    </main>
  );
}
