import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-zinc-900">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-3 text-sm leading-7 text-zinc-600">
        Alamat yang Anda buka tidak tersedia atau telah dipindahkan.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Kembali ke beranda
      </Link>
    </section>
  );
}
