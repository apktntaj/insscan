"use server";

import { redirect } from "next/navigation";
import { getSiteUrl } from "@/app/features/auth/config/auth-url";
import { createClient } from
  "@/app/features/auth/infrastructure/supabase/server";

export async function signInWithGoogle(): Promise<never> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/account`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_start");
  }

  redirect(data.url);
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
