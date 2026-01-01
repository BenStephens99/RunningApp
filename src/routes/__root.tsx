/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
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

import {
  AppShell,
  Box,
  Button,
  Group,
  MantineProvider,
  Text,
  Skeleton,
} from "@mantine/core";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../utils/queryClient";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryCacheKeys } from "~/QueryCacheKeys";
import { EditingProvider } from "~/contexts/EditingContext";

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
      ...seo({
        title:
          "TanStack Start | Type-Safe, Client-First, Full-Stack React Framework",
        description: `TanStack Start is a type-safe, client-first, full-stack React framework. `,
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
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" },
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
  });

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
              footer={{ height: 60 }}
            >
              <AppShell.Header>
                <Group w="100%" maw={"1200px"} mx="auto" p="xs" justify="end">
                  <Group>
                    {user ? (
                      <Group>
                        <Text>{user.email}</Text>
                        <Button component={Link} to="/logout">
                          Logout
                        </Button>
                      </Group>
                    ) : (
                      <Button component={Link} to="/login">
                        Login
                      </Button>
                    )}
                  </Group>
                </Group>
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
