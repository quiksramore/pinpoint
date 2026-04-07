"use client";

import { Tabs, TabsList, TabsTrigger } from "@pinpoint/shad-ui/components/tabs";
import { useRouter } from "next/navigation";

export default function Header({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();

  const handleTabChange = (value: string) => {
    router.push(`/${value}`);
  };

  return (
    <header className="flex items-center justify-between bg-background p-8">
      <h1 className="font-bold text-2xl">Pinpoint</h1>
      <div>
        <Tabs className="w-full" defaultValue={defaultValue} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="feed" className="cursor-pointer">
              Feed
            </TabsTrigger>
            <TabsTrigger value="map" className="cursor-pointer">
              Map
            </TabsTrigger>
            <TabsTrigger value="profile" className="cursor-pointer">
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="cursor-pointer">
              DMs
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
}
