import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { handleStravaCallback } from "~/stravaServerFunctions";
import { Stack, Text, Loader, Alert } from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";

export const Route = createFileRoute("/strava-callback")({
  component: StravaCallback,
});

function StravaCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handleCallback = useServerFn(handleStravaCallback);

  useEffect(() => {
    const handleAuth = async () => {
      // Get code and state from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get("error");

      if (error) {
        setStatus("error");
        setErrorMessage("Strava authorization was denied or failed.");
        setTimeout(() => {
          navigate({ to: "/" });
        }, 3000);
        return;
      }

      if (!code || !state) {
        setStatus("error");
        setErrorMessage("Missing authorization code or state.");
        setTimeout(() => {
          navigate({ to: "/" });
        }, 3000);
        return;
      }

      try {
        await handleCallback({ data: { code, state } });
        setStatus("success");
        setTimeout(() => {
          navigate({ to: "/" });
        }, 2000);
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to connect Strava account."
        );
        setTimeout(() => {
          navigate({ to: "/" });
        }, 3000);
      }
    };

    handleAuth();
  }, [navigate, handleCallback]);

  return (
    <Stack align="center" justify="center" style={{ minHeight: "50vh" }} gap="md">
      {status === "loading" && (
        <>
          <Loader size="lg" />
          <Text>Connecting your Strava account...</Text>
        </>
      )}
      {status === "success" && (
        <>
          <IconCheck size={48} color="green" />
          <Text fw="bold" c="green">
            Strava account connected successfully!
          </Text>
          <Text c="dimmed">Redirecting...</Text>
        </>
      )}
      {status === "error" && (
        <>
          <IconAlertCircle size={48} color="red" />
          <Alert color="red" title="Error">
            {errorMessage || "An error occurred while connecting your Strava account."}
          </Alert>
          <Text c="dimmed">Redirecting...</Text>
        </>
      )}
    </Stack>
  );
}
