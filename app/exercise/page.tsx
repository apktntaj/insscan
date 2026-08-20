import ExercisePage from "@/app/features/learning/components/ExercisePage";
import { getRandomQuestions } from "@/app/features/learning/config/exercise-config";
import { createPageMetadata } from "@/app/shared/config/site-metadata";

const QUIZ_SIZE = 10;

export const metadata = createPageMetadata({
  title: "Latihan Soal Kepabeanan",
  description:
    "Latihan soal pilihan ganda untuk menguji pemahaman materi kepabeanan Indonesia.",
  path: "/exercise",
});

export default function Exercise() {
  const initialQuestions = getRandomQuestions(QUIZ_SIZE);
  const initialShuffleSeed = initialQuestions.map((question) => question.id).join(":");

  return (
    <ExercisePage
      initialQuestions={initialQuestions}
      initialShuffleSeed={initialShuffleSeed}
    />
  );
}
