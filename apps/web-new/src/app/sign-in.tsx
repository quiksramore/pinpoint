import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { authClient } from "#/lib/auth-web-client.ts";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/",
  }),
  component: SignIn,
});

function SignIn() {
  const { redirect } = Route.useSearch();

  useEffect(() => {
    authClient.signIn.social({
      provider: "google",
      callbackURL: redirect,
    });
  }, [redirect]);

  return <main>Redirecting...</main>;
}
