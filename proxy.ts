import type { NextRequest } from "next/server";
import { refreshAuthSession } from
  "@/app/features/auth/infrastructure/supabase/proxy";

export function proxy(request: NextRequest) {
  return refreshAuthSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
