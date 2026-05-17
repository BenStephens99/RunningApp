import { Button, Card, Group, Stack, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { createFileRoute, Link } from '@tanstack/react-router'

import { useGetRunPlans } from "~/hooks/runPlans";
import { RunPlanListItem } from '~/types';
import { useDisclosure } from '@mantine/hooks';
import { CreatePlanModal } from '~/components/CreatePlanModal';

export const Route = createFileRoute("/_authed/")({
  component: Home,
});

function Home() {
  const runPlans = useGetRunPlans();
  const [createPlanOpened, { open: openCreatePlan, close: closeCreatePlan }] =
    useDisclosure(false);

  return (
    <>
      <CreatePlanModal opened={createPlanOpened} onClose={closeCreatePlan} />
      <Stack>
        <Button onClick={openCreatePlan}>Create plan</Button>
        {runPlans.data?.map((plan) => (
          <RunPlanItem key={plan.id} plan={plan} />
        ))}
      </Stack>
    </>
  );
}

function RunPlanItem({ plan }: { plan: RunPlanListItem }) {
  return (
    <Card bg={plan.final_run?.strava_link ? 'green.0' : 'white'} component={Link} href={`/plan/${plan.id}`}>
      <Group
        justify="space-between"
        align="center"
      >
        <Group>
          <Text>{plan.name}</Text>
          <Text>{plan.final_run?.run_length} km</Text>
        </Group>
        <Group>
          {plan.final_run?.strava_link && (
            <IconCheck size={16} />
          )}
        </Group>
      </Group>
    </Card>
  );
}