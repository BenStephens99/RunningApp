import { useServerFn } from "@tanstack/react-start";
import { getUser, login, signup, signInWithGoogle } from "~/serverFunctions";
import { useRouter } from "@tanstack/react-router";
import { QueryCacheKeys } from "~/QueryCacheKeys";
import { useInvalidateMutation } from "./useInvalidateMutation";
import { useQuery, useMutation } from "@tanstack/react-query";

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
      data: { error: boolean; message: string } | undefined
    ) => {
      if (!data?.error) {
        await router.invalidate();
        router.navigate({ to: "/" });
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
      console.log("data", data);
      if (data && "url" in data && data.url) {
        window.location.href = data.url;
      }
    },
  });
}
