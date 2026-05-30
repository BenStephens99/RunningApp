import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { handleGoogleCallback } from "~/authServerFunctions";
import { Stack, Text, Loader, Alert, Button, Skeleton } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { getSupabaseBrowserClient } from "~/utils/supabase";

export const Route = createFileRoute("/auth-callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const handleCallback = useServerFn(handleGoogleCallback);

  useEffect(() => {
    const handleAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const errorParam = urlParams.get("error");

      if (errorParam || !code) {
        setError(urlParams.get("error_description") || "Authentication failed.");
        return;
      }

      const result = await handleCallback({ data: { code } });

      console.log("result", result);

      if (result?.error) {
        setError(result.message);
        return;
      }

      if (result?.session) {
        localStorage.setItem('app-access-token', result.session.access_token);
        localStorage.setItem('app-refresh-token', result.session.refresh_token);
        navigate({ to: "/" });
      }
    };

    handleAuth();
  }, []);

  if (error) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: "50vh" }} gap="md">
        <IconAlertCircle size={48} color="red" />
        <Alert color="red" title="Sign in failed">
          {error}
          <Button onClick={() => navigate({ to: "/login" })}>Retry</Button>
        </Alert>
      </Stack>
    );
  }

  return (
    <Skeleton height={100} width={100} />
  );
}
