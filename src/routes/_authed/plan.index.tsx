import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconCheck,
  IconChevronRight,
  IconRun,
  IconTrash,
} from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

import {
  useDeleteRunPlan,
  useGetRunPlans,
  useUpdateRunPlan,
} from "~/hooks/runPlans";
import { RunPlanListItem } from "~/types";

export const Route = createFileRoute("/_authed/plan/")({
  component: Plans,
});

function Plans() {
  const runPlans = useGetRunPlans();

  return (
    <Stack gap="md">
      <Text fw="bold" fz="sm" tt="uppercase" c="var(--mantine-color-gray-5)">
        Your plans
      </Text>
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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [planName, setPlanName] = useState(plan.name ?? "");
  const updateRunPlan = useUpdateRunPlan();
  const deleteRunPlan = useDeleteRunPlan();
  const trimmedName = planName.trim();

  useEffect(() => {
    if (isEditModalOpen) {
      setPlanName(plan.name ?? "");
    }
  }, [isEditModalOpen, plan.name]);

  return (
    <>
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
          borderColor: "var(--mantine-primary-color-5)",
          borderWidth: 1,
          transition: "border-color 150ms ease, transform 150ms ease",
        }}
        styles={{
          root: {
            "&:hover": {
              borderColor: "var(--mantine-color-dark-3)",
              transform: "translateY(-1px)",
            },
          },
        }}
      >
        <Group justify="space-between" wrap="nowrap" align="center">
          <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
            <ActionIcon
              size="lg"
              radius="md"
              variant="light"
              color={isCompleted ? "green.3" : "gray"}
              bg={"var(--mantine-primary-color-5)"}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsEditModalOpen(true);
              }}
              aria-label={`Edit ${plan.name ?? "plan"}`}
            >
              {isCompleted ? <IconCheck size={18} /> : <IconRun size={18} />}
            </ActionIcon>

            <Stack gap={4} style={{ minWidth: 0 }}>
              <Text fw={600} c="var(--mantine-color-gray-1)" truncate>
                {plan.name ?? "Untitled plan"}
              </Text>
              <Group gap="xs">
                {plan.final_run ? (
                  <Text size="xs" c="dimmed">
                    {plan.final_run?.run_length} km · {dayjs(plan.final_run?.run_date).format("D MMM YYYY")}
                  </Text>
                ) : (
                  <Text size="xs" c="dimmed">
                    No final run set
                  </Text>
                )}
              </Group>
            </Stack>
          </Group>

          <Group gap="xs" wrap="nowrap">
            {isCompleted ? (
              <Badge variant="light" color="green">
                Completed
              </Badge>
            ) : (
              <ThemeIcon
                variant="transparent"
                color="gray"
                size="sm"
                aria-hidden
              >
                <IconChevronRight size={18} />
              </ThemeIcon>
            )}
          </Group>
        </Group>
      </Card>

      <Modal
        opened={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit plan"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Plan name"
            value={planName}
            onChange={(event) => setPlanName(event.currentTarget.value)}
            placeholder="Enter plan name"
            maxLength={100}
          />
          <Group justify="space-between">
            <Button
              variant="light"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              Delete plan
            </Button>
            <Group>
              <Button
                variant="default"
                onClick={() => setIsEditModalOpen(false)}
                disabled={
                  updateRunPlan.isPending || deleteRunPlan.isPending
                }
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  updateRunPlan.mutate(
                    { data: { plan_id: plan.id, name: trimmedName } },
                    {
                      onSuccess: () => {
                        setIsEditModalOpen(false);
                      },
                    }
                  );
                }}
                loading={updateRunPlan.isPending}
                disabled={!trimmedName || deleteRunPlan.isPending}
              >
                Save
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete plan?"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            This will permanently delete{" "}
            <Text span fw={700}>
              {plan.name ?? "this plan"}
            </Text>
            . This action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={deleteRunPlan.isPending}
            >
              Cancel
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => {
                deleteRunPlan.mutate(
                  { data: { plan_id: plan.id } },
                  {
                    onSuccess: () => {
                      setIsDeleteConfirmOpen(false);
                      setIsEditModalOpen(false);
                    },
                  }
                );
              }}
              loading={deleteRunPlan.isPending}
            >
              Yes, delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
