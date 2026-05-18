import {
  Badge,
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconCheck,
  IconChevronRight,
  IconRun,
} from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";

import { useGetRunPlans } from "~/hooks/runPlans";
import { RunPlanListItem } from "~/types";

export const Route = createFileRoute("/_authed/")({
  component: Home,
});

function Home() {
  const runPlans = useGetRunPlans();

  return (
    <Stack gap="md">
      <Title order={2} c="var(--mantine-color-gray-2)">
        Your plans
      </Title>
      <Stack gap="sm">
        {runPlans.data?.map((plan) => (
          <RunPlanItem key={plan.id} plan={plan} />
        ))}
      </Stack>
    </Stack>
  );
}

function RunPlanItem({ plan }: { plan: RunPlanListItem }) {
  const isCompleted = !!plan.final_run?.strava_link;

  return (
    <Card
      component={Link}
      to={`/plan/${plan.id}`}
      shadow="sm"
      radius="md"
      padding="md"
      withBorder
      bg="var(--mantine-primary-color-6)"
      c="var(--mantine-color-gray-3)"
      style={{
        textDecoration: "none",
        borderColor: isCompleted
          ? "var(--mantine-color-green-6)"
          : "var(--mantine-primary-color-5)",
        borderWidth: isCompleted ? 2 : 1,
        transition: "border-color 150ms ease, transform 150ms ease",
      }}
      styles={{
        root: {
          "&:hover": {
            borderColor: isCompleted
              ? "var(--mantine-color-green-5)"
              : "var(--mantine-color-dark-3)",
            transform: "translateY(-1px)",
          },
        },
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="center">
        <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
          <ThemeIcon
            size="lg"
            radius="md"
            variant="light"
            color={isCompleted ? "green" : "gray"}
            bg={
              isCompleted
                ? "var(--mantine-color-green-9)"
                : "var(--mantine-primary-color-5)"
            }
          >
            {isCompleted ? <IconCheck size={18} /> : <IconRun size={18} />}
          </ThemeIcon>

          <Stack gap={4} style={{ minWidth: 0 }}>
            <Text fw={600} c="var(--mantine-color-gray-1)" truncate>
              {plan.name ?? "Untitled plan"}
              {isCompleted && (
                <Badge
                  variant="light"
                  color="green"
                  size="sm"
                  ml="xs"
                  leftSection={<IconCheck size={12} />}
                >
                  Complete
                </Badge>
              )}
            </Text>
            <Group gap="xs">
              {plan.final_run ? (
                <Text size="xs" c="dimmed">
                  Final run · {plan.final_run.run_length} km
                </Text>
              ) : (
                <Text size="xs" c="dimmed">
                  No final run set
                </Text>
              )}
              <Text size="xs" c="dimmed">
                · {dayjs(plan.created_at).format("D MMM YYYY")}
              </Text>
            </Group>
          </Stack>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <ThemeIcon
            variant="transparent"
            color="gray"
            size="sm"
            aria-hidden
          >
            <IconChevronRight size={18} />
          </ThemeIcon>
        </Group>
      </Group>
    </Card>
  );
}