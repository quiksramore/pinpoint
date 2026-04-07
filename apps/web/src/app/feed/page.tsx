import CreatePostButton from "./_components/create-post-button";
import Header from "../_components/header";

export default function Page() {
  return (
    <main className="min-h-screen bg-background-900">
      <Header defaultValue="feed" />
      <CreatePostButton />
      {/* <Textarea className=" w-1/2" /> */}
    </main>
  );
}
