"use client";
import { Button } from "@pinpoint/shad-ui/components/button";
import { useRouter } from "next/dist/client/components/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black p-4 font-sans text-white">
      <Button onClick={() => router.push("/feed")}>Go to Feed</Button>
    </div>
  );
}
