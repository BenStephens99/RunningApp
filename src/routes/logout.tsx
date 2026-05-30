import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { logout } from "../authServerFunctions";
import { queryClient } from "../utils/queryClient";

export const Route = createFileRoute("/logout")({
  component: Logout,
});

function Logout() {
  const logoutFn = useServerFn(logout);

  useEffect(() => {
    const handleLogout = async () => {
      queryClient.clear();
      localStorage.removeItem('app-access-token');
      localStorage.removeItem('app-refresh-token');
      await logoutFn();
    };

    handleLogout();
  }, [logoutFn]);

  return null;
}
