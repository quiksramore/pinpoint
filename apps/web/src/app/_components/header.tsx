"use client";

import { Button } from "@pinpoint/shad-ui/components/button";
import { cn } from "@pinpoint/shad-ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Map as MapIcon, Newspaper, Send, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClientWeb } from "../../lib/auth-client-web";
import { webClientORPC } from "../../lib/orpc-web-client";
import PinpointLogo from "./pinpoint-logo";

export default function Header({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const { data: authData } = authClientWeb.useSession();
  const { data: profileData } = useQuery(
    webClientORPC.profile.getProfileById.queryOptions({
      enabled: !!authData,
      // biome-ignore lint/style/noNonNullAssertion: only enabled when authData is defined
      input: { id: authData?.user.id },
    })
  );

  return (
    <header className={cn("flex items-center justify-between bg-background p-8")}>
      <div className="flex items-center gap-2">
        <PinpointLogo />
        <h1 className="font-bold text-2xl text-secondary">PinPoint</h1>
      </div>
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
          onClick={() => router.push(`/${profileData?.username}`)}
        >
          <UserRound />
          Your Profile
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
