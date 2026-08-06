import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="flex flex-col gap-4">
      <section className="">
        <div>Hello World!</div>
      </section>
    </main>
  );
}
