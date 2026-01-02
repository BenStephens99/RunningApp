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
import { getUser } from "../serverFunctions";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import { AppShell, Box, MantineProvider, Skeleton } from "@mantine/core";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../utils/queryClient";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryCacheKeys } from "~/QueryCacheKeys";
import { EditingProvider } from "~/contexts/EditingContext";
import { Header } from "~/components/Header";

const Footer = React.lazy(() =>
  import("~/components/Footer").then((mod) => ({ default: mod.Footer }))
);

export const Route = createRootRoute({
  beforeLoad: async () => {
    const user = await getUser();

    return {
      user,
    };
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
        name: "theme-color",
        content: "#228be6",
      },
      {
        name: "apple-mobile-web-app-capable",
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
  queryClient.setQueryData(QueryCacheKeys.user(), user);

  const theme = createTheme({
    cursorType: "pointer",
    components: {
      ActionIcon: {
        defaultProps: {
          bg: "indigo.0",
          color: "blue",
          variant: "light",
        },
      },
    },
  });

  // Register service worker for PWA
  React.useEffect(() => {
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
      <MantineProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <EditingProvider>
            <AppShell
              bg="gray.0"
              header={{ height: 60 }}
              footer={{ height: 76 }}
            >
              <AppShell.Header bg="indigo.3">
                <Header />
              </AppShell.Header>
              <AppShell.Main w="100%" maw={"1200px"} mx="auto" px="xs">
                <Box my="md" h="100%">
                  {children}
                </Box>
              </AppShell.Main>
              <AppShell.Footer>
                <React.Suspense fallback={<Skeleton height={60} />}>
                  <Footer />
                </React.Suspense>
              </AppShell.Footer>
            </AppShell>
            <TanStackRouterDevtools position="bottom-right" />
            <ReactQueryDevtools buttonPosition="bottom-right" />
            <Scripts />
          </EditingProvider>
        </QueryClientProvider>
      </MantineProvider>
    </html>
  );
}
