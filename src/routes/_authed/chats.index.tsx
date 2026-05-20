import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/chats/")({
    component: Chats,
  });

function Chats() {
  return <div>Chats</div>;
}
