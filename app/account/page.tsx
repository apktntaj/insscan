import type { Metadata } from "next";
import { signOut } from "@/app/features/auth/actions/auth.actions";
import { getAccountSummary } from "@/app/features/auth/data-access/account";

export const metadata: Metadata = {
  title: "Akun",
  description: "Kelola akun dan kredit Pesisir.",
  robots: { index: false, follow: false },
};

const creditFormatter = new Intl.NumberFormat("id-ID");

export default async function AccountPage() {
  const account = await getAccountSummary();

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          Akun
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
          {account.displayName ?? "Pengguna Pesisir"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{account.email}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <article className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-6">
          <p className="text-sm font-medium text-sky-800">Saldo kredit</p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-sky-950">
            {creditFormatter.format(account.creditBalance)}
          </p>
          <p className="mt-2 text-xs leading-5 text-sky-700">
            Harga dan pembelian kredit masih dalam tahap Early Access.
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-sm font-medium text-zinc-800">Model pemakaian</p>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Kredit nantinya dipotong berdasarkan jumlah HS Code yang berhasil diperiksa. Belum ada pemotongan selama tahap ini.
          </p>
        </article>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="font-semibold text-zinc-900">Sesi akun</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Keluar dari akun pada perangkat ini.
        </p>
        <form action={signOut} className="mt-4">
          <button type="submit" className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            Keluar
          </button>
        </form>
      </div>
    </section>
  );
}
