import { useServerFn } from "@tanstack/react-start";
import { getUser, login, signup, signInWithGoogle } from "~/serverFunctions";
import { useRouter } from "@tanstack/react-router";
import { QueryCacheKeys } from "~/QueryCacheKeys";
import { useInvalidateMutation } from "./useInvalidateMutation";
import { useQuery } from "@tanstack/react-query";

export function useGetUser() {
  return useQuery({
    queryKey: QueryCacheKeys.user(),
    queryFn: useServerFn(getUser),
  });
}

export function useLogin() {
  const router = useRouter();

  return useInvalidateMutation({
    mutationFn: useServerFn(login),
    queryKey: QueryCacheKeys.user(),
    onSuccess: async (
      data: { error: boolean; message: string; session: { access_token: string; refresh_token: string } | null } | undefined
    ) => {
      if (!data?.error) {
        localStorage.setItem('app-access-token', data?.session?.access_token ?? '');
        localStorage.setItem('app-refresh-token', data?.session?.refresh_token ?? '');
        await router.invalidate();
        const lastVisitedPlanId = localStorage.getItem('last-visited-plan-id');
        if (lastVisitedPlanId) {
          router.navigate({ to: `/plan/${lastVisitedPlanId}` });
        } else {
          router.navigate({ to: "/" });
        }
        return;
      }
    },
  });
}

export function useSignup() {
  return useInvalidateMutation({
    mutationFn: useServerFn(signup),
    queryKey: QueryCacheKeys.user(),
  });
}

export function useGoogleLogin() {
  const googleSignInFn = useServerFn(signInWithGoogle);

  return useInvalidateMutation({
    mutationFn: googleSignInFn,
    queryKey: QueryCacheKeys.user(),
    onSuccess: (data) => {
      if (!data?.error) {
        window.location.href = data.url;
      }
    },
  });
}
