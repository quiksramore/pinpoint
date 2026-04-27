import Header from "../_components/header";
import MessagesBox from "./_components/messages-box";

export default function Page() {
  return (
    <main className="flex h-screen flex-col bg-background-900">
      <Header defaultValue="messages" />
      <MessagesBox />
      {/* <Textarea className=" w-1/2" /> */}
    </main>
  );
}
