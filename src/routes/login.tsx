import { createFileRoute } from "@tanstack/react-router";
import { Login } from "../components/Login";
import { Group } from "@mantine/core";

export const Route = createFileRoute("/login")({
  component: Page,
});

function Page() {
  return (
    <Group justify="center" align="center" h="100%">
      <Login />
    </Group>
  );
}
