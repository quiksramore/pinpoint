"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { env } from "../../env";
import { authClientWeb } from "../../lib/auth-client-web";
import { webClientORPC } from "../../lib/orpc-web-client";

export default function AuthLayer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: authData, isPending } = authClientWeb.useSession();
  const [authId, setAuthId] = useState<string>();

  const { data: profileData, isPending: isProfilePending } = useQuery(
    webClientORPC.profile.getProfile.queryOptions({
      enabled: !!authId,
      // biome-ignore lint/style/noNonNullAssertion: only enabled when authId is defined
      input: authId!,
    })
  );

  // sets better-auth id once fetched
  useEffect(() => {
    const isAuthRoute = pathname.startsWith("/auth");
    if (isPending || isAuthRoute) return;

    if (!authData) {
      authClientWeb.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
        errorCallbackURL: `${env.NEXT_PUBLIC_WEBSITE_URL}/auth/error`,
      });
    }
  }, [authData, isPending, pathname, searchParams]);

  // // sets internal profile once fetched
  //
  // useEffect(() => {
  //   // this user as not passed onboarding
  //   if (!profileData && !isProfilePending) return;
  // }, [profileData]);

  // return !profileData && !isProfilePending ? <div>Onboarding required</div> : null;
  return null;
}
