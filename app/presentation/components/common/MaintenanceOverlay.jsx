"use client";

/**
 * MaintenanceOverlay
 * Presentation Layer - Common Component
 *
 * Menampilkan blur overlay di atas konten saat fitur sedang dalam maintenance window.
 * Wrapper ini tidak mengubah layout konten di dalamnya.
 *
 * @param {{
 *   isActive: boolean,
 *   title: string,
 *   message: string,
 *   children: React.ReactNode
 * }} props
 * @returns {JSX.Element}
 *
 * @example
 * <MaintenanceOverlay isActive={true} title="Tidak Tersedia" message="Coba lagi pukul 06.00">
 *   <CekLartasScanner />
 * </MaintenanceOverlay>
 *
 * @example
 * <MaintenanceOverlay isActive={false} title="..." message="...">
 *   <CekLartasScanner />  {/* rendered normally *\/}
 * </MaintenanceOverlay>
 */
export default function MaintenanceOverlay({ isActive, title, message, children }) {
  return (
    <div className="relative">
      {/* Konten asli — selalu dirender agar tidak ada layout shift */}
      <div className={isActive ? "pointer-events-none select-none blur-sm" : undefined}>
        {children}
      </div>

      {/* Overlay — hanya muncul saat isActive */}
      {isActive && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="mx-4 max-w-sm rounded-2xl border border-zinc-200 bg-white px-7 py-6 text-center shadow-lg">
            {/* Ikon jam */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-500"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
