import {
  Button,
  Modal,
  Text,
  Group,
  NumberInput,
  Chip,
  Textarea,
  Paper,
  Loader,
  List,
  Table,
} from "@mantine/core";
import { Stack } from "@mantine/core";
import { useState } from "react";
import { MessageHistory, RunPayload } from "~/types";
import { useAddMultipleRuns } from "~/hooks/runs";
import { useCreateGeminiRunPlan } from "~/hooks/gemini";
import { IconRun } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import ReactMarkdown from "react-markdown";
import {
  useGetUnconfirmedPlans,
  useMarkPlanAsDiscarded,
  useMarkPlanAsCompleted,
} from "~/hooks/llmPlanMessages";
import dayjs from "dayjs";

export function CreatePlanModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs" w="100%" wrap="nowrap">
          <IconRun size={40} />
          <Stack gap="0">
            <Text fw="bold" fz="lg">
              Create your running plan
            </Text>
          </Stack>
        </Group>
      }
      size="lg"
    >
      <ModalContent opened={opened} onClose={onClose} />
    </Modal>
  );
}

function ModalContent({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const unconfirmedPlans = useGetUnconfirmedPlans();
  const createGeminiRunPlan = useCreateGeminiRunPlan();
  const addMultipleRuns = useAddMultipleRuns();
  const markPlanAsDiscarded = useMarkPlanAsDiscarded();
  const markPlanAsCompleted = useMarkPlanAsCompleted();

  const [runs, setRuns] = useState<RunPayload[]>([]);
  const [distanceGoal, setDistanceGoal] = useState(10);
  const [currentAge, setCurrentAge] = useState(20);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string | null>(
    new Date().toISOString()
  );
  const [raceDate, setRaceDate] = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [hasSubmittedPlan, setHasSubmittedPlan] = useState(false);

  const pendingPlan = unconfirmedPlans.data?.[0];

  const isFormValid = () => {
    if (currentAge <= 0) {
      setErrorMessage("Please enter a valid age");
      return false;
    }
    if (distanceGoal <= 0) {
      setErrorMessage("Please enter a valid distance goal");
      return false;
    }
    if (daysOfWeek.length === 0) {
      setErrorMessage("Please select at least one training day");
      return false;
    }
    if (!startDate) {
      setErrorMessage("Please select a start date");
      return false;
    }
    if (!raceDate) {
      setErrorMessage("Please select a race date");
      return false;
    }
    return true;
  };

  const handleSumbitPlan = () => {
    setErrorMessage("");
    if (isFormValid()) {
      setHasSubmittedPlan(true);
      createGeminiRunPlan.mutate(
        {
          data: {
            current_age: currentAge,
            distance_goal: distanceGoal,
            days_of_week: daysOfWeek,
            start_date: startDate ?? "",
            race_date: raceDate ?? "",
            additional_notes: additionalNotes,
          },
        },
        {
          onSuccess: () => {
            unconfirmedPlans.refetch();
          },
        }
      );
    }
  };

  const handleSavePlan = (plan: MessageHistory) => {
    markPlanAsCompleted.mutate({
      data: {
        plan_id: plan.id,
      },
    });
    addMultipleRuns.mutate(
      {
        data: plan.formatted_response.plan.map((run) => ({
          run_date: run.date,
          run_length: run.distance,
        })),
      },
      {
        onSuccess: () => {
          onClose();
          setRuns([]);
        },
      }
    );
  };

  if (
    unconfirmedPlans.isLoading ||
    createGeminiRunPlan.isPending ||
    pendingPlan?.status === "generating"
  ) {
    return (
      <Stack h="50vh" justify="center" align="center">
        <Loader />
        {createGeminiRunPlan.isPending ||
          (pendingPlan?.status === "generating" && (
            <Text>Generating your running plan</Text>
          ))}
      </Stack>
    );
  }

  if (pendingPlan) {
    return (
      <Stack>
        <Paper withBorder p="md">
          <Text fz="md" fw="bold" mb="xs">
            Notes:
          </Text>
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <Text fz="sm" mb="xs">
                  {children}
                </Text>
              ),
              ul: ({ children }) => <List>{children}</List>,
              ol: ({ children }) => <List>{children}</List>,
              li: ({ children }) => (
                <List.Item>
                  <Text fz="sm" mb="xs">
                    {children}
                  </Text>
                </List.Item>
              ),
            }}
          >
            {pendingPlan.formatted_response.comments}
          </ReactMarkdown>
        </Paper>
        <Paper withBorder p="md">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>
                  <Text fz="sm" fw="bold" ta="right">
                    Distance (km)
                  </Text>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pendingPlan.formatted_response.plan.map((run, index) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    {dayjs(run.date).format("ddd DD/MM/YYYY")}
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" ta="right">
                      {run.distance}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
        <Group wrap="nowrap">
          <Button
            onClick={() =>
              markPlanAsDiscarded.mutate({
                data: {
                  plan_id: pendingPlan.id,
                },
              })
            }
            variant="filled"
            color="red"
            fullWidth
            loading={markPlanAsDiscarded.isPending}
          >
            Discard Plan
          </Button>
          <Button
            onClick={() => handleSavePlan(pendingPlan)}
            fullWidth
            loading={markPlanAsCompleted.isPending || addMultipleRuns.isPending}
          >
            Save Plan
          </Button>
        </Group>
      </Stack>
    );
  }

  return (
    <Stack pt="0" gap="md">
      <NumberInput
        label="Current Age"
        value={currentAge}
        onChange={(value) => setCurrentAge(value as number)}
        min={0}
        step={1}
        withAsterisk
        w="100%"
      />
      <NumberInput
        label="Distance goal (km)"
        value={distanceGoal}
        onChange={(value) => setDistanceGoal(value as number)}
        min={0}
        step={0.1}
        decimalScale={1}
        withAsterisk
        w="100%"
      />
      <Stack gap="xs">
        <Group gap="4px">
          <Text fz="sm" fw="500">
            Traning days
          </Text>
          <Text fz="sm" c="red">
            *
          </Text>
        </Group>
        <Chip.Group
          multiple
          value={daysOfWeek}
          onChange={(value) => setDaysOfWeek(value as string[])}
        >
          <Group gap="xs" justify="center">
            <Chip value="m">Mon</Chip>
            <Chip value="t">Tue</Chip>
            <Chip value="w">Wed</Chip>
            <Chip value="th">Thu</Chip>
            <Chip value="f">Fri</Chip>
            <Chip value="sa">Sat</Chip>
            <Chip value="su">Sun</Chip>
          </Group>
        </Chip.Group>
      </Stack>
      <Group wrap="nowrap" gap="md">
        <DateInput
          withAsterisk
          label="Start date"
          value={startDate}
          onChange={(value) => setStartDate(value as unknown as string)}
          w="100%"
        />
        <DateInput
          withAsterisk
          label="Race date"
          value={raceDate}
          onChange={(value) => setRaceDate(value as unknown as string)}
          w="100%"
        />
      </Group>
      <Textarea
        label="Additional notes"
        value={additionalNotes}
        autosize
        onChange={(e) => setAdditionalNotes(e.target.value)}
        w="100%"
        placeholder="Add some notes about your current fitness level. (Current running habits and pace etc)"
      />
      {errorMessage && <Text c="red">{errorMessage}</Text>}
      <Button onClick={handleSumbitPlan}>Generate Plan</Button>
    </Stack>
  );
}
