import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { logout } from "../serverFunctions";
import { queryClient } from "../utils/queryClient";

export const Route = createFileRoute("/logout")({
  component: Logout,
});

function Logout() {
  const logoutFn = useServerFn(logout);

  useEffect(() => {
    const handleLogout = async () => {
      // Clear all query cache before logging out
      queryClient.clear();
      // Call logout server function
      await logoutFn();
    };

    handleLogout();
  }, [logoutFn]);

  return null;
}
