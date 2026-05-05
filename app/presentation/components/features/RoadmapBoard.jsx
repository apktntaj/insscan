/**
 * RoadmapBoard Component
 * Presentation Layer — Feature component
 *
 * Menampilkan daftar Feature_Item yang diurutkan berdasarkan status.
 * Setiap item ditampilkan dengan nama, deskripsi, dan badge status berwarna.
 */

/**
 * Mengonversi FeatureStatus ke label Bahasa Indonesia yang ditampilkan ke user.
 *
 * @param {import("../../config/feedback-config").FeatureStatus} status
 * @returns {string} label dalam Bahasa Indonesia
 *
 * @example
 * getStatusLabel("live")        // => "Tersedia"
 * @example
 * getStatusLabel("in-progress") // => "Sedang Dikerjakan"
 * @example
 * getStatusLabel("planned")     // => "Direncanakan"
 */
export function getStatusLabel(status) {
  const labels = {
    live: "Tersedia",
    "in-progress": "Sedang Dikerjakan",
    planned: "Direncanakan",
  };
  return labels[status] ?? "Unknown";
}

/**
 * Mengembalikan Tailwind class untuk badge dan dot indicator berdasarkan FeatureStatus.
 *
 * @param {import("../../config/feedback-config").FeatureStatus} status
 * @returns {{ badge: string, dot: string }}
 *
 * @example
 * getStatusStyle("live")
 * // => { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" }
 *
 * @example
 * getStatusStyle("in-progress")
 * // => { badge: "bg-sky-100 text-sky-700", dot: "bg-sky-500" }
 *
 * @example
 * getStatusStyle("planned")
 * // => { badge: "bg-zinc-100 text-zinc-600", dot: "bg-zinc-400" }
 */
export function getStatusStyle(status) {
  const styles = {
    live: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    "in-progress": { badge: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
    planned: { badge: "bg-zinc-100 text-zinc-600", dot: "bg-zinc-400" },
  };
  return styles[status] ?? { badge: "bg-zinc-100 text-zinc-600", dot: "bg-zinc-400" };
}

/** Urutan tampilan: live → in-progress → planned */
const STATUS_ORDER = { live: 0, "in-progress": 1, planned: 2 };

/**
 * Mengurutkan array FeatureItem berdasarkan urutan status: live → in-progress → planned.
 * Tidak mengubah array asli (pure function).
 *
 * @param {import("../../config/feedback-config").FeatureItem[]} items
 * @returns {import("../../config/feedback-config").FeatureItem[]} array baru yang terurut
 *
 * @example
 * sortByStatus([
 *   { id: "a", name: "A", description: "...", status: "planned" },
 *   { id: "b", name: "B", description: "...", status: "live" },
 * ])
 * // => [{ id: "b", ...status: "live" }, { id: "a", ...status: "planned" }]
 *
 * @example
 * sortByStatus([
 *   { id: "c", name: "C", description: "...", status: "in-progress" },
 *   { id: "d", name: "D", description: "...", status: "live" },
 *   { id: "e", name: "E", description: "...", status: "planned" },
 * ])
 * // => [{ id: "d", ...live }, { id: "c", ...in-progress }, { id: "e", ...planned }]
 */
export function sortByStatus(items) {
  return items.slice().sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
  );
}

/**
 * Merender daftar Feature_Item yang diurutkan berdasarkan status menggunakan timeline DaisyUI.
 * Setiap item ditampilkan dengan nama, deskripsi, dan badge status berwarna dalam format timeline.
 *
 * @param {{ items: import("../../config/feedback-config").FeatureItem[] }} props
 * @returns {JSX.Element}
 *
 * @example
 * // Render dengan satu item "live"
 * <RoadmapBoard items={[{ id: "x", name: "Fitur X", description: "Desc.", status: "live" }]} />
 * // => menampilkan "Fitur X", "Desc.", badge "Tersedia" dalam timeline
 *
 * @example
 * // Render dengan items campuran — urutan output: live dulu, lalu planned
 * <RoadmapBoard items={[
 *   { id: "p", name: "Planned", description: "...", status: "planned" },
 *   { id: "l", name: "Live",    description: "...", status: "live" },
 * ]} />
 * // => "Live" muncul sebelum "Planned" di timeline
 */
export default function RoadmapBoard({ items }) {
  const sorted = sortByStatus(items);

  return (
    <section aria-labelledby="roadmap-heading">
      <h2
        id="roadmap-heading"
        className="text-3xl text-center font-semibold text-zinc-900"
      >
        Roadmap Pesisir
      </h2>

      <ul className="timeline timeline-vertical mt-5" role="list">
        {sorted.map((item, index) => {
          const style = getStatusStyle(item.status);
          const label = getStatusLabel(item.status);
          const isFirst = index === 0;
          const isLast = index === sorted.length - 1;
          const isEven = index % 2 === 0;

          return (
            <li key={item.id}>
              {!isFirst && <hr />}
              <div className="timeline-middle">
                <span
                  className={`h-3 w-3 rounded-full ${style.dot}`}
                  aria-hidden="true"
                />
              </div>
              <div className={`${isEven ? 'timeline-start' : 'timeline-end'} mb-10`}>
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {item.name}
                  </h3>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.badge}`}
                  >
                    {label}
                  </span>
                </div>
              </div>
              {!isLast && <hr />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
