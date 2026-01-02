import { Group, Button, Card, Stack, TextInput, Text } from "@mantine/core";
import { useLogin } from "~/hooks/auth";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

export function Login() {
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
          </Stack>
        </form>
      </Card>
    </Group>
  );
}
