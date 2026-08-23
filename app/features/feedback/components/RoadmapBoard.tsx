import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type FeatureItem = {
  id: string;
  name: string;
  description?: string;
  status: string;
};

const STATUS_ORDER: Record<string, number> = {
  live: 0,
  "in-progress": 1,
  planned: 2,
};

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    live: "Tersedia",
    "in-progress": "Sedang dikerjakan",
    planned: "Direncanakan",
  };

  return labels[status] ?? "Status belum diketahui";
}

export function getStatusStyle(status: string) {
  const styles: Record<string, { badge: string; dot: string }> = {
    live: { badge: "bg-primary/10 text-primary", dot: "bg-primary" },
    "in-progress": {
      badge: "bg-secondary text-secondary-foreground",
      dot: "bg-secondary-foreground/60",
    },
    planned: { badge: "bg-muted text-muted-foreground", dot: "bg-border" },
  };

  return styles[status] ?? styles.planned;
}

export function sortByStatus(items: FeatureItem[]) {
  return items
    .slice()
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));
}

export default function RoadmapBoard({ items }: { items: FeatureItem[] }) {
  const sorted = sortByStatus(items);

  return (
    <section aria-labelledby="roadmap-heading">
      <div className="max-w-2xl">
        <Badge variant="outline">Roadmap produk</Badge>
        <h2 id="roadmap-heading" className="mt-4 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Fitur yang tersedia dan sedang kami siapkan.
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Status dibuat singkat agar tim Anda dapat melihat arah pengembangan Pesisir dengan cepat.
        </p>
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-2" role="list">
        {sorted.map((item) => {
          const style = getStatusStyle(item.status);

          return (
            <li key={item.id}>
              <Card size="sm" className="h-full">
                <CardContent className="flex items-start gap-3">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-medium leading-5">{item.name}</h3>
                      <Badge variant="outline" className={style.badge}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                    {item.description ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
