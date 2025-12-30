import { createFileRoute } from "@tanstack/react-router";
import { logout } from "../serverFunctions";

export const Route = createFileRoute("/logout")({
  preload: false,
  loader: () => logout(),
});
