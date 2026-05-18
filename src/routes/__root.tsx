/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import * as React from "react";
import { createTheme } from "@mantine/core";
import { DefaultCatchBoundary } from "../components/DefaultCatchBoundary";
import { NotFound } from "../components/NotFound";
import appCss from "../styles/app.css?url";
import { seo } from "../utils/seo";
import { getUser, getSession } from "../serverFunctions";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import { AppShell, Box, MantineProvider, Skeleton } from "@mantine/core";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../utils/queryClient";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryCacheKeys } from "~/QueryCacheKeys";
import { Header } from "~/components/Header";
import { useEffect } from "react";

const Footer = React.lazy(() =>
  import("~/components/Footer").then((mod) => ({ default: mod.Footer }))
);

export const Route = createRootRoute({
  beforeLoad: async () => {

    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('app-access-token') ?? ''
      const refreshToken = localStorage.getItem('app-refresh-token') ?? ''

      const session = await getSession({
        data: {
          accessToken,
          refreshToken,
        },
      });



      if (session) {
        localStorage.setItem('app-access-token', session.access_token);
        localStorage.setItem('app-refresh-token', session.refresh_token);

        const user = await getUser()
        return {
          user,
        };
      }

      return {
        user: null,
      };
    } else {
      const session = await getSession()

      if (session) {
        const user = await getUser()

        return {
          user,
        };
      }

      return {
        user: null,
      };
    }


  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "default",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "Running App",
      },
      ...seo({
        title: "Run Planner | Create and track your running plans",
        description: `Run Planner is a tool to create and track your running plans`,
      }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "shortcut icon", type: "image/x-icon", href: "/favicon.ico" },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { user } = Route.useRouteContext();

  useEffect(() => {
    queryClient.setQueryData(QueryCacheKeys.user(), user);
  }, [user]);

  const theme = createTheme({
    cursorType: "pointer",
    primaryColor: "dark",
    primaryShade: 6,
  });

  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration);
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError);
          });
      });
    }
  }, []);

  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <MantineProvider theme={theme} forceColorScheme="dark">
          <Notifications />
          <QueryClientProvider client={queryClient}>
            <AppShell
              bg="var(--mantine-primary-color-7)"
              header={{ height: 60 }}
              footer={{ height: 80 }}
            >
              <AppShell.Header bg="var(--mantine-primary-color-8)" withBorder={false}>
                <Header />
              </AppShell.Header>
              <AppShell.Main w="100%" maw={"1200px"} mx="auto" px="xs">
                <Box my="md" h="100%">
                  {children}
                </Box>
              </AppShell.Main>
              <AppShell.Footer bg="var(--mantine-primary-color-8)" withBorder={false}>
                <React.Suspense fallback={<Skeleton height={60} />}>
                  <Footer />
                </React.Suspense>
              </AppShell.Footer>
            </AppShell>
            <TanStackRouterDevtools position="bottom-right" />
            <ReactQueryDevtools buttonPosition="bottom-right" />
            <Scripts />
          </QueryClientProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
