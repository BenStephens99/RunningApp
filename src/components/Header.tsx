import { ActionIcon, Group } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useRouteContext } from "@tanstack/react-router";

export function Header() {
  const { user } = useRouteContext({ from: "__root__" });

  return (
    <Group w="100%" maw={"1200px"} mx="auto" p="xs" justify="end">
      <Group>
        {user && (
          <ActionIcon component={Link} to="/logout" variant="light" size="lg">
            <IconLogout size={20} />
          </ActionIcon>
        )}
      </Group>
    </Group>
  );
}
