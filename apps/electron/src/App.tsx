interface Message {
  content: string;
  from: "expo" | "electron" | "web";
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black p-4 font-sans text-white">
      <span>Hello World!</span>
    </div>
  );
}
