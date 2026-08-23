import type { Metadata } from "next";
import { redirect } from "next/navigation";
import GoogleSignInButton from
  "@/app/features/auth/components/GoogleSignInButton";
import { getCurrentUser } from "@/app/features/auth/data-access/auth";

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
    <section className="mx-auto flex min-h-[65vh] max-w-md items-center">
      <div className="w-full rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Akun Pesisir
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">
            Masuk atau daftar
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Gunakan akun Google untuk mengakses saldo kredit dan riwayat pemakaian Anda.
          </p>
        </div>

        {errorMessage && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="mt-7">
          <GoogleSignInButton />
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-zinc-400">
          Dengan melanjutkan, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi Pesisir.
        </p>
      </div>
    </section>
  );
}
