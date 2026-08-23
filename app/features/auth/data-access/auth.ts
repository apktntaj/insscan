import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from
  "@/app/features/auth/infrastructure/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.id !== claimsData.claims.sub) return null;

  const metadataName = data.user.user_metadata.full_name;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    displayName: typeof metadataName === "string" ? metadataName : null,
  };
});

export async function requireCurrentUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
