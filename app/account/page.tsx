import type { Metadata } from "next";
import { signOut } from "@/app/features/auth/actions/auth.actions";
import { getAccountSummary } from "@/app/features/auth/data-access/account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Akun",
  description: "Kelola akun dan kredit Pesisir.",
  robots: { index: false, follow: false },
};

const creditFormatter = new Intl.NumberFormat("id-ID");

export default async function AccountPage() {
  const account = await getAccountSummary();

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Badge variant="secondary">Akun</Badge>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {account.displayName ?? "Pengguna Pesisir"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{account.email}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="bg-secondary text-secondary-foreground">
          <CardHeader>
            <CardTitle>Saldo kredit</CardTitle>
            <CardDescription>Siap digunakan saat pembelian kredit tersedia.</CardDescription>
          </CardHeader>
          <CardContent><p className="text-4xl font-semibold tracking-tight tabular-nums">
            {creditFormatter.format(account.creditBalance)}
          </p></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Model pemakaian</CardTitle></CardHeader>
          <CardContent><p className="text-sm leading-6 text-muted-foreground">
            Kredit nantinya dipotong berdasarkan jumlah HS Code yang berhasil diperiksa. Belum ada pemotongan selama tahap ini.
          </p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sesi akun</CardTitle>
          <CardDescription>Keluar dari akun pada perangkat ini.</CardDescription>
        </CardHeader>
        <CardFooter>
          <form action={signOut}><Button type="submit" variant="outline">Keluar</Button></form>
        </CardFooter>
      </Card>
    </section>
  );
}
