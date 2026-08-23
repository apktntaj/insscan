"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { signOut } from "@/app/features/auth/actions/auth.actions";
import { createClient } from
  "@/app/features/auth/infrastructure/supabase/client";

interface AuthNavProps {
  mobile?: boolean;
}

function getDisplayName(user: User): string {
  const metadataName = user.user_metadata.full_name;
  return typeof metadataName === "string"
    ? metadataName
    : (user.email ?? "Akun");
}

export default function AuthNav({ mobile = false }: AuthNavProps) {
  const [supabase] = useState(createClient);
  const [user, setUser] = useState<User | null>();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  if (user === undefined) {
    return (
      <span
        aria-hidden="true"
        className={mobile
          ? "my-3 h-10 w-full animate-pulse rounded-xl bg-zinc-100"
          : "h-9 w-20 animate-pulse rounded-xl bg-zinc-200"}
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={mobile
          ? "py-4 text-sm font-semibold text-sky-700"
          : "rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"}
      >
        Masuk
      </Link>
    );
  }

  return (
    <div className={mobile ? "flex flex-col gap-1 border-t border-zinc-100 pt-3" : "flex items-center gap-2"}>
      <Link
        href="/account"
        title={user.email ?? undefined}
        className={mobile
          ? "py-3 text-sm font-semibold text-sky-700"
          : "max-w-36 truncate rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"}
      >
        {getDisplayName(user)}
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className={mobile
            ? "py-3 text-left text-sm text-zinc-500 hover:text-zinc-800"
            : "rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"}
        >
          Keluar
        </button>
      </form>
    </div>
  );
}
