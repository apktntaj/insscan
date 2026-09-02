import { readAnalysisStream } from "@/app/features/hs-finder/infrastructure/services/read-analysis-stream";

describe("readAnalysisStream", () => {
  it("returns validated complete data split across chunks", async () => {
    const encoder = new TextEncoder();
    const payload = JSON.stringify({
      event: "complete",
      data: {
        facts: {
          productName: { value: "Laptop", confidence: "high", evidence: "laptop" },
          primaryFunction: { value: "komputer portabel", confidence: "high", evidence: "komputer" },
          physicalForm: { value: "portabel", confidence: "medium", evidence: "portabel" },
        },
        missingFacts: [],
        questions: [],
      },
    }) + "\n";
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(payload.slice(0, 41)));
        controller.enqueue(encoder.encode(payload.slice(41)));
        controller.close();
      },
    });

    await expect(readAnalysisStream(new Response(stream))).resolves.toMatchObject({
      status: "ready_for_classification",
      facts: { productName: { value: "Laptop" } },
    });
  });

  it("throws the route error message", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(
          '{"event":"error","errorMessage":"Layanan tidak tersedia."}\n',
        ));
        controller.close();
      },
    });

    await expect(readAnalysisStream(new Response(stream))).rejects.toThrow(
      "Layanan tidak tersedia.",
    );
  });
});
