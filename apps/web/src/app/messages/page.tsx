import Header from "../_components/header";
import MessagingBox from "./_components/messaging-box";

export default function Page() {
  return (
    <main className="flex h-screen flex-col bg-background-900">
      <Header defaultValue="messages" />
      <MessagingBox />
      {/* <Textarea className=" w-1/2" /> */}
    </main>
  );
}
