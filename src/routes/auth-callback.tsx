import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { handleGoogleCallback } from "~/serverFunctions";
import { Stack, Text, Loader, Alert } from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";

export const Route = createFileRoute("/auth-callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handleCallback = useServerFn(handleGoogleCallback);

  useEffect(() => {
    const handleAuth = async () => {
      // Get code from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const error = urlParams.get("error");
      const errorDescription = urlParams.get("error_description");

      if (error) {
        setStatus("error");
        setErrorMessage(errorDescription || "Authentication was denied or failed.");
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 3000);
        return;
      }

      if (!code) {
        setStatus("error");
        setErrorMessage("Missing authorization code.");
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 3000);
        return;
      }

      try {
        const result = await handleCallback({ data: { code } });
        if (result?.error) {
          setStatus("error");
          setErrorMessage(result.message);
          setTimeout(() => {
            navigate({ to: "/login" });
          }, 3000);
          return;
        }
        setStatus("success");
        setTimeout(() => {
          navigate({ to: "/" });
        }, 1500);
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to complete authentication."
        );
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 3000);
      }
    };

    handleAuth();
  }, [navigate, handleCallback]);

  return (
    <Stack
      align="center"
      justify="center"
      style={{ minHeight: "50vh" }}
      gap="md"
    >
      {status === "loading" && (
        <>
          <Loader size="lg" />
          <Text>Completing sign in...</Text>
        </>
      )}
      {status === "success" && (
        <>
          <IconCheck size={48} color="green" />
          <Text fw="bold" c="green">
            Signed in successfully!
          </Text>
          <Text c="dimmed">Redirecting...</Text>
        </>
      )}
      {status === "error" && (
        <>
          <IconAlertCircle size={48} color="red" />
          <Alert color="red" title="Sign in failed">
            {errorMessage || "An error occurred during authentication."}
          </Alert>
          <Text c="dimmed">Redirecting to login...</Text>
        </>
      )}
    </Stack>
  );
}

