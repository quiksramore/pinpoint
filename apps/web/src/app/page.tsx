"use client";
import { Button } from "@pinpoint/shad-ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authClientWeb } from "../lib/auth-client-web";
import { webClientORPC } from "../lib/orpc-web-client";

export default function Home() {
  const router = useRouter();
  const createProfileMutation = useMutation(webClientORPC.profile.createProfile.mutationOptions());
  const { data: authData } = authClientWeb.useSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black p-4 font-sans text-white">
      <Button onClick={() => router.push("/feed")}>Go to Feed</Button>

      {/** biome-ignore lint/style/noNonNullAssertion: don't give a fuck */}
      <Button onClick={() => createProfileMutation.mutate({ username: authData!.user.name })}>Create Profile</Button>
    </div>
  );
}
