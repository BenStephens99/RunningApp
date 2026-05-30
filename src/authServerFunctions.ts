import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./utils/supabase";

export const getSession = createServerFn({ method: "GET" })
  .inputValidator((d?: { accessToken?: string; refreshToken?: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();

    if (data?.accessToken && data?.refreshToken) {
      await supabase.auth.setSession({
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
      });
    }
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session ?? null;
  });

export const getUser = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data, error: _error } = await supabase.auth.getUser();

  if (!data.user?.email) {
    return null;
  }

  return {
    ...data.user,
  };
});

export const login = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error, data: sessionData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        error: true,
        message: error.message,
        session: null,
      };
    }

    return {
      error: false,
      message: "Login successful",
      session: sessionData.session,
    };
  });

export const logout = createServerFn().handler(async () => {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      error: true,
      message: error.message,
    };
  }

  throw redirect({
    href: "/",
  });
});

export const signup = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { email: string; password: string; redirectUrl?: string }) => d
  )
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) {
      return {
        error: true,
        message: error.message,
      };
    }

    throw redirect({
      href: data.redirectUrl || "/",
    });
  });

export const signInWithGoogle = createServerFn({ method: "POST" }).handler(
  async () => {
    const supabase = getSupabaseServerClient();

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const redirectTo = `${baseUrl}/auth-callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      return {
        error: true,
        message: error.message,
      };
    }

    return {
      url: data.url,
    };
  }
);

export const handleGoogleCallback = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();

    const { error, data: sessionData } =
      await supabase.auth.exchangeCodeForSession(data.code);

    if (error) {
      return {
        error: true,
        message: error.message,
        session: null,
      };
    }

    return {
      error: false,
      message: "Login successful",
      session: sessionData.session,
    };
  });
