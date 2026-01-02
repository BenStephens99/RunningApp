import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Stack, Text, Loader, Alert } from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { useServerFn } from "@tanstack/react-start";
import { getUser } from "~/serverFunctions";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const getUserFn = useServerFn(getUser);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      // Supabase OAuth callback can come via hash fragments or query params
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const urlParams = new URLSearchParams(window.location.search);

      const error = hashParams.get("error") || urlParams.get("error");
      const errorDescription =
        hashParams.get("error_description") ||
        urlParams.get("error_description");

      if (error) {
        setStatus("error");
        setErrorMessage(
          errorDescription || "Google authorization was denied or failed."
        );
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 3000);
        return;
      }

      try {
        // Supabase handles the OAuth callback automatically via cookies
        // Wait a moment for the session to be established
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Verify the session was created by checking for user
        const user = await getUserFn();

        if (user) {
          setStatus("success");
          setTimeout(() => {
            navigate({ to: "/" });
          }, 1500);
        } else {
          throw new Error("Failed to authenticate");
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Failed to complete Google authentication."
        );
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 3000);
      }
    };

    handleAuth();
  }, [navigate, getUserFn]);

  return (
    <Stack align="center" justify="center" h="100vh" gap="md">
      {status === "loading" && (
        <>
          <Loader size="lg" />
          <Text>Completing Google authentication...</Text>
        </>
      )}
      {status === "success" && (
        <>
          <IconCheck size={48} color="green" />
          <Text size="lg" fw="bold" c="green">
            Successfully authenticated with Google!
          </Text>
          <Text c="dimmed">Redirecting...</Text>
        </>
      )}
      {status === "error" && (
        <>
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Authentication Error"
            color="red"
          >
            {errorMessage || "An error occurred during Google authentication."}
          </Alert>
          <Text c="dimmed" size="sm">
            Redirecting to login...
          </Text>
        </>
      )}
    </Stack>
  );
}
