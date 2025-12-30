import { createFileRoute } from "@tanstack/react-router";
import { Signup } from "../components/SignUp";
import { Group } from "@mantine/core";

export const Route = createFileRoute("/signup")({
  component: Page,
});

function Page() {
  return (
    <Group justify="center" align="center" h="100%">
      <Signup />
    </Group>
  );
}
