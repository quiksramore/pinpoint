"use client";

import { Button } from "@pinpoint/shad-ui/components/button";
import { Map as MapIcon, Newspaper, Send, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Header({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between bg-background p-8">
      <h1 className="font-bold text-2xl">Pinpoint</h1>
      <div>
        <Button variant={defaultValue === "feed" ? "default" : "ghost"} className="mr-4 cursor-pointer p-5" onClick={() => router.push("/feed")}>
          <Newspaper />
          Feed
        </Button>
        <Button variant={defaultValue === "map" ? "default" : "ghost"} className="mr-4 cursor-pointer p-5" onClick={() => router.push("/map")}>
          <MapIcon />
          Map
        </Button>
        <Button
          variant={defaultValue === "profile" ? "default" : "ghost"}
          className="mr-4 cursor-pointer p-5"
          onClick={() => router.push("/profile")}
        >
          <UserRound />
          Profile
        </Button>
        <Button
          variant={defaultValue === "messages" ? "default" : "ghost"}
          className="mr-4 cursor-pointer p-5"
          onClick={() => router.push("/messages")}
        >
          <Send />
          Messages
        </Button>
      </div>
    </header>
  );
}
