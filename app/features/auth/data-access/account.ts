import "server-only";

import { createClient } from
  "@/app/features/auth/infrastructure/supabase/server";
import { requireCurrentUser } from "./auth";

export interface AccountSummary {
  id: string;
  email: string | null;
  displayName: string | null;
  creditBalance: number;
}

export async function getAccountSummary(): Promise<AccountSummary> {
  const user = await requireCurrentUser();
  const supabase = await createClient();

  const [profileResult, creditResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("credit_accounts")
      .select("balance")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (profileResult.error || creditResult.error) {
    throw new Error("Data akun belum dapat dimuat.");
  }

  return {
    id: user.id,
    email: user.email,
    displayName: profileResult.data.display_name ?? user.displayName,
    creditBalance: creditResult.data.balance,
  };
}
