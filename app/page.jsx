import Hero from "./ui/Hero";

const title = "Tools untuk semua kebutuhan pabean.";
const subtitle =
  "Serahkan pekerjaan repetitif pada komputer. Sumber daya manusia harusnya fokus pada tugas yang lebih strategis.";

export default function Home() {
  return (
    <>
      <Hero title={title} subtitle={subtitle} />
    </>
  );
}
