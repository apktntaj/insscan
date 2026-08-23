import type { Metadata } from "next";
import { redirect } from "next/navigation";
import GoogleSignInButton from
  "@/app/features/auth/components/GoogleSignInButton";
import { getCurrentUser } from "@/app/features/auth/data-access/auth";
import Link from "next/link";
import { CircleAlertIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun Pesisir menggunakan Google.",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

const errorMessages: Record<string, string> = {
  oauth_start: "Login Google belum dapat dimulai. Silakan coba lagi.",
  oauth_callback: "Login Google gagal diselesaikan. Silakan coba lagi.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (user) redirect("/account");

  const errorMessage = params.error ? errorMessages[params.error] : undefined;

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center"><Badge variant="secondary">Akun Pesisir</Badge></div>
          <CardTitle className="text-2xl">Masuk atau daftar</CardTitle>
          <CardDescription>
            Gunakan akun Google untuk mengakses saldo kredit dan riwayat pemakaian Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
        {errorMessage && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <GoogleSignInButton />
        </CardContent>
        <CardFooter className="justify-center text-center text-xs text-muted-foreground">
          <p>
            Dengan melanjutkan, Anda menyetujui <Link className="underline underline-offset-4" href="/terms">Ketentuan</Link> dan <Link className="underline underline-offset-4" href="/privacy">Kebijakan Privasi</Link>.
          </p>
        </CardFooter>
      </Card>
    </section>
  );
}
