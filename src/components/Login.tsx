import {
  Group,
  Button,
  Card,
  Stack,
  TextInput,
  Text,
  Divider,
} from "@mantine/core";
import { useLogin } from "~/hooks/auth";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getGoogleAuthUrl } from "~/serverFunctions";
import { IconBrandGoogle } from "@tabler/icons-react";

export function Login() {
  const login = useLogin();
  const getGoogleAuth = useServerFn(getGoogleAuthUrl);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleSignIn = async () => {
    try {
      const { url } = await getGoogleAuth();
      window.location.href = url;

      console.log("url", url);
    } catch (error) {
      console.error("Error initiating Google sign in:", error);
    }
  };

  return (
    <Group justify="center" mt="20vh">
      <Card withBorder w="400px" radius="md" p="md" shadow="sm">
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
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              fullWidth
              leftSection={<IconBrandGoogle size={20} />}
            >
              Continue with Google
            </Button>
          </Stack>
        </form>
      </Card>
    </Group>
  );
}
