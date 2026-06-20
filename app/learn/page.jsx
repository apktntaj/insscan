import { LearnPage } from "../presentation/components";

export const metadata = {
  title: "Materi Kepabeanan",
  description:
    "Pelajari materi kepabeanan Indonesia: definisi, kewajiban pabean, tata laksana ekspor impor, dan lainnya.",
};

export default function Learn() {
  return (
    <div className="space-y-5 pb-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">Belajar</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 sm:text-3xl">Materi Kepabeanan</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Ringkasan materi diklat kepabeanan — dari terminologi dasar hingga tata laksana ekspor impor.
        </p>
      </div>
      <LearnPage />
    </div>
  );
}
