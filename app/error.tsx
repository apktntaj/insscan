"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-xl py-16 text-center" role="alert">
      <p className="text-xs font-semibold uppercase tracking-widest text-red-600">
        Terjadi gangguan
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-zinc-900">
        Halaman tidak dapat ditampilkan
      </h1>
      <p className="mt-3 text-sm leading-7 text-zinc-600">
        Coba muat ulang bagian ini. Jika masalah berlanjut, silakan kembali
        beberapa saat lagi.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Coba lagi
      </button>
    </section>
  );
}
