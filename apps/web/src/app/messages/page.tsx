import Header from "../_components/header";
import MessagesUI from "./_components/messages-ui";

export default function Page() {
  return (
    <main className="min-h-screen bg-background-900">
      <Header defaultValue="messages" />
      <MessagesUI />
      {/* <Textarea className=" w-1/2" /> */}
    </main>
  );
}
