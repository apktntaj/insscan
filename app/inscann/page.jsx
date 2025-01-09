import ActionTableWrapper from "../ui/FileReaderWrapper";
import Title from "../ui/Title";

const title = "INSScan";
const description = [
  "AI-powered invoice scanner for instant HS code lookup and",
  "retrieve realtime tax & restriction goods regulation from Indonesia National Single Window (INSW) site.",
];

export default function InscannPage() {
  return (
    <div className='container'>
      <Title title={title} descs={description} />
      <ActionTableWrapper />
    </div>
  );
}
