"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOutIcon, UserIcon } from "lucide-react";
import { signOut } from "@/app/features/auth/actions/auth.actions";
import { createClient } from "@/app/features/auth/infrastructure/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AuthNavProps {
  mobile?: boolean;
}

function getDisplayName(user: User): string {
  const metadataName = user.user_metadata.full_name;
  return typeof metadataName === "string" ? metadataName : (user.email ?? "Akun");
}

function getInitial(user: User): string {
  return getDisplayName(user).trim().charAt(0).toUpperCase() || "P";
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
    return <Skeleton className={mobile ? "h-9 w-full" : "h-8 w-24"} />;
  }

  if (!user) {
    return (
      <Link href="/login" className={cn(buttonVariants(), mobile && "w-full")}>
        Masuk
      </Link>
    );
  }

  return (
    <div className={mobile ? "flex flex-col gap-2" : "flex items-center gap-1"}>
      <Link
        href="/account"
        title={user.email ?? undefined}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          mobile ? "w-full justify-start" : "max-w-44",
        )}
      >
        {mobile ? (
          <UserIcon data-icon="inline-start" />
        ) : (
          <Avatar size="sm">
            <AvatarFallback>{getInitial(user)}</AvatarFallback>
          </Avatar>
        )}
        <span className="truncate">{getDisplayName(user)}</span>
      </Link>
      <form action={signOut}>
        <Button
          type="submit"
          variant="outline"
          className={mobile ? "w-full" : undefined}
          size={mobile ? "default" : "icon"}
        >
          <LogOutIcon data-icon={mobile ? "inline-start" : undefined} />
          {mobile ? "Keluar" : <span className="sr-only">Keluar</span>}
        </Button>
      </form>
    </div>
  );
}
