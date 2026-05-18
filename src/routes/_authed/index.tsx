import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_authed/")({
  component: AuthedIndexRedirect,
});

function AuthedIndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const lastVisitedPlanId = localStorage.getItem("last-visited-plan-id");
    if (lastVisitedPlanId) {
      navigate({
        to: "/plan/$planId",
        params: { planId: lastVisitedPlanId },
      });
    } else {
      navigate({ to: "/plan" });
    }

  }, [navigate]);

  return null;
}



