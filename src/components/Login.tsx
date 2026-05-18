import {
  Group,
  Button,
  Card,
  Stack,
  TextInput,
  Text,
  Divider,
  Skeleton,
} from "@mantine/core";
import { useLogin } from "~/hooks/auth";
import { useEffect, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { GoogleSignIn } from "./GoogleSignIn";
import { getSession } from "~/serverFunctions";

export function Login() {
  const login = useLogin();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loadedAuth, setLoadedAuth] = useState(false);

  useEffect(() => {
    void (async () => {
      const accessToken = localStorage.getItem("app-access-token") ?? "";
      const refreshToken = localStorage.getItem("app-refresh-token") ?? "";

      let session = null;

      try {
        session = await getSession({
          data: {
            accessToken,
            refreshToken,
          },
        });

      } finally {
        if (session) {
          localStorage.setItem('app-access-token', session.access_token);
          localStorage.setItem('app-refresh-token', session.refresh_token);
          await router.invalidate();
          const lastVisitedPlanId = localStorage.getItem('last-visited-plan-id');
          console.log('lastVisitedPlanId', lastVisitedPlanId);
          if (lastVisitedPlanId) {
            router.navigate({ to: `/plan/${lastVisitedPlanId}` });
          } else {
            router.navigate({ to: "/" });
          }
        } else {
          setLoadedAuth(true);
        }
      }
    })();
  }, [router]);

  if (!loadedAuth) {
    return (
      <Skeleton height={100} width={100} />
    );
  }


  return (
    <Group justify="center">
      <Card w="400px" radius="md" p="md" bg="transparent">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate({
              data: {
                email,
                password,
              },
            });
          }}
        >
          <Stack>
            <Text ta="center" fw="bold" fz="lg">
              Login
            </Text>
            <TextInput
              label="Email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextInput
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Text
              ta="right"
              fz="sm"
              c="blue"
              component={Link}
              to="/signup"
              td="underline"
              w="fit-content"
              ml="auto"
            >
              Sign up
            </Text>
            {login.data?.error && <Text color="red">{login.data.message}</Text>}
            <Button type="submit" loading={login.isPending}>
              Login
            </Button>
            <Divider label="OR" labelPosition="center" />
            <GoogleSignIn />
          </Stack>
        </form>
      </Card>
    </Group>
  );
}
