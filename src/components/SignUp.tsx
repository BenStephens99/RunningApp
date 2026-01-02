import {
  Group,
  Button,
  Card,
  Stack,
  TextInput,
  Text,
  Divider,
} from "@mantine/core";
import { useLogin, useSignup } from "~/hooks/auth";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

export function Signup() {
  const signup = useSignup();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Group justify="center" mt="20vh">
      <Card withBorder w="400px" radius="md" p="md" shadow="sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            signup.mutate({
              data: {
                email,
                password,
              },
            });
          }}
        >
          <Stack>
            <Text ta="center" fw="bold" fz="lg">
              Sign up
            </Text>
            <TextInput
              label="Email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextInput
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Text
              ta="right"
              fz="sm"
              c="blue"
              component={Link}
              to="/login"
              td="underline"
              w="fit-content"
              ml="auto"
            >
              Login
            </Text>
            <Button type="submit" loading={signup.isPending}>
              Sign Up
            </Button>
            {signup.data?.error && <Text c="red">{signup.data.message}</Text>}
            <Divider label="OR" labelPosition="center" />
          </Stack>
        </form>
      </Card>
    </Group>
  );
}
