import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { notifyManager, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { env } from "#/env.ts";
import { authClient } from "#/lib/auth-web-client";

export type AppRouterContext = {
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
  queryClient: QueryClient;
};

export function createAppRouterContext(): AppRouterContext {
  if (typeof document !== "undefined") {
    notifyManager.setScheduler(window.requestAnimationFrame);
  }

  const convexClient = new ConvexReactClient(env.VITE_CONVEX_URL, {
    expectAuth: true,
    logger: false,
  });

  const convexQueryClient = new ConvexQueryClient(convexClient);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: convexQueryClient.queryFn(),
        queryKeyHashFn: convexQueryClient.hashFn(),
      },
    },
  });

  convexQueryClient.connect(queryClient);

  return {
    convexClient,
    convexQueryClient,
    queryClient,
  };
}

export function AppProviders({
  children,
  context,
  initialToken,
}: {
  children: ReactNode;
  context: AppRouterContext;
  initialToken?: string | null;
}) {
  return (
    <ConvexProvider client={context.convexClient}>
      <ConvexBetterAuthProvider client={context.convexClient} authClient={authClient} initialToken={initialToken}>
        {children}
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: "Tanstack Query",
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
      </ConvexBetterAuthProvider>
    </ConvexProvider>
  );
}
