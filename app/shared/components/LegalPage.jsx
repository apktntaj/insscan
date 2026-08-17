import Link from "next/link";

export default function LegalPage({ eyebrow, title, intro, children }) {
  return <article className="mx-auto max-w-3xl py-8 sm:py-12">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">{eyebrow}</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">{title}</h1>
    <p className="mt-4 text-sm leading-7 text-zinc-600">{intro}</p>
    <p className="mt-2 text-xs text-zinc-400">Berlaku sejak 16 Agustus 2026</p>
    <div className="mt-8 space-y-7 text-sm leading-7 text-zinc-700">{children}</div>
    <div className="mt-10 border-t border-zinc-200 pt-6"><Link className="text-sm font-medium text-cyan-700 hover:text-cyan-800" href="/">Kembali ke Pesisir</Link></div>
  </article>;
}

export function Section({ title, children }) {
  return <section><h2 className="text-lg font-semibold text-zinc-900">{title}</h2><div className="mt-2 space-y-2">{children}</div></section>;
}
