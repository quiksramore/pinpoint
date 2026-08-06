import appCss from "@pinpoint/shad-ui/globals.css?url";
import { createRootRouteWithContext, ErrorComponent, HeadContent, Outlet, redirect, Scripts, useRouteContext } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AppProviders, type AppRouterContext } from "#/providers/app-provider";
import { getToken } from "../lib/auth-server";

const getAuth = createServerFn({ method: "GET" }).handler(async () => await getToken());

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRouteWithContext<AppRouterContext>()({
  beforeLoad: async ({ context, location }) => {
    const token = await getAuth();

    if (token) {
      context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

    const isPublicRoute = location.pathname.startsWith("/sign-in") || location.pathname.startsWith("/api/auth");
    if (!token && !isPublicRoute) {
      const redirectTo = location.href;

      throw redirect({
        search: {
          redirect: redirectTo,
        },
        to: "/sign-in",
      });
    }

    return {
      isAuthenticated: Boolean(token),
      token,
    };
  },
  component: RootComponent,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
  head: () => ({
    links: [
      {
        href: appCss,
        rel: "stylesheet",
      },
    ],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        content: "width=device-width, initial-scale=1",
        name: "viewport",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootComponent() {
  const context = useRouteContext({ from: Route.id });

  return (
    <AppProviders context={context} initialToken={context.token}>
      <Outlet />
    </AppProviders>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
