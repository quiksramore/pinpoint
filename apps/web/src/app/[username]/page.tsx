"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { authClientWeb } from "../../lib/auth-client-web";
import { webClientORPC } from "../../lib/orpc-web-client";

export default function Page() {
  const { username } = useParams();

  const { data: authData } = authClientWeb.useSession();
  const { data: profileData } = useQuery(
    webClientORPC.profile.getProfileById.queryOptions({
      enabled: !!authData,
      input: { id: authData?.user?.id },
    })
  );

  return <div>{username}</div>;
}
