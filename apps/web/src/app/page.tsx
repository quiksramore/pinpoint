"use client";
import { Button } from "@pinpoint/shad-ui/components/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black p-4 font-sans text-white">
      <Button>Go to Feed</Button>
    </div>
  );
}
