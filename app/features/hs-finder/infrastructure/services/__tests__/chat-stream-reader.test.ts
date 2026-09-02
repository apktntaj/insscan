/**
 * Unit tests untuk readChatStream
 */

import { readChatStream } from "../chat-stream-reader";
import type { ChatStreamCallbacks } from "../chat-stream-reader";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function makeStreamResponse(lines: string[]): Response {
  const body = lines.join("\n") + "\n";
  const encoded = new TextEncoder().encode(body);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoded);
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

function makeCallbacks(overrides: Partial<ChatStreamCallbacks> = {}): {
  callbacks: ChatStreamCallbacks;
  calls: Record<string, unknown[][]>;
} {
  const calls: Record<string, unknown[][]> = {
    onStep: [],
    onClarification: [],
    onResult: [],
    onError: [],
  };
  const callbacks: ChatStreamCallbacks = {
    onStep: (label, detail) => calls.onStep.push([label, detail]),
    onClarification: (reason, questions) => calls.onClarification.push([reason, questions]),
    onResult: (recommendations, coverageMap) => calls.onResult.push([recommendations, coverageMap]),
    onError: (message, errorCode) => calls.onError.push([message, errorCode]),
    ...overrides,
  };
  return { callbacks, calls };
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe("readChatStream", () => {
  test("memanggil onStep untuk setiap event step", async () => {
    const { callbacks, calls } = makeCallbacks();
    const response = makeStreamResponse([
      JSON.stringify({ event: "step", label: "Mengidentifikasi bab", detail: "" }),
      JSON.stringify({ event: "step", label: "Mengidentifikasi bab", detail: "→ Bab 84, Bab 85" }),
    ]);

    await readChatStream(response, callbacks);

    expect(calls.onStep).toHaveLength(2);
    expect(calls.onStep[0]).toEqual(["Mengidentifikasi bab", ""]);
    expect(calls.onStep[1]).toEqual(["Mengidentifikasi bab", "→ Bab 84, Bab 85"]);
  });

  test("memanggil onResult dengan rekomendasi yang sudah dinormalisasi", async () => {
    const { callbacks, calls } = makeCallbacks();
    const recommendations = [
      {
        hsCode: "847130",
        description: "Mesin pengolah data portabel",
        confidence: "high",
        rationale: "Laptop masuk pos ini",
        quotedRule: "Catatan Bab 84...",
      },
    ];
    const coverageMap = {
      chapters: { "84": "validated" },
      hasUnvalidated: false,
    };
    const response = makeStreamResponse([
      JSON.stringify({ event: "result", recommendations, coverageMap }),
    ]);

    await readChatStream(response, callbacks);

    expect(calls.onResult).toHaveLength(1);
    const [recs, map] = calls.onResult[0] as [unknown[], unknown];
    expect(recs).toHaveLength(1);
    expect((recs[0] as Record<string, unknown>).hsCode).toBe("847130");
    expect((recs[0] as Record<string, unknown>).confidence).toBe("high");
    expect(map).toEqual(coverageMap);
  });

  test("memanggil onClarification dengan reason dan questions", async () => {
    const { callbacks, calls } = makeCallbacks();
    const response = makeStreamResponse([
      JSON.stringify({
        event: "clarification",
        reason: "Perlu tahu apakah untuk motor atau sepeda",
        questions: ["Apakah helm ini untuk kendaraan bermotor?"],
      }),
    ]);

    await readChatStream(response, callbacks);

    expect(calls.onClarification).toHaveLength(1);
    expect(calls.onClarification[0][0]).toBe("Perlu tahu apakah untuk motor atau sepeda");
    expect(calls.onClarification[0][1]).toEqual(["Apakah helm ini untuk kendaraan bermotor?"]);
  });

  test("memanggil onError untuk event error", async () => {
    const { callbacks, calls } = makeCallbacks();
    const response = makeStreamResponse([
      JSON.stringify({
        event: "error",
        errorMessage: "Koneksi AI terputus. Silakan coba lagi.",
        errorCode: "GEMINI_TIMEOUT",
      }),
    ]);

    await readChatStream(response, callbacks);

    expect(calls.onError).toHaveLength(1);
    expect(calls.onError[0]).toEqual([
      "Koneksi AI terputus. Silakan coba lagi.",
      "GEMINI_TIMEOUT",
    ]);
  });

  test("memanggil onError jika response tidak punya body", async () => {
    const { callbacks, calls } = makeCallbacks();
    const response = new Response(null, { status: 200 });

    await readChatStream(response, callbacks);

    expect(calls.onError).toHaveLength(1);
  });

  test("memanggil callbacks dalam urutan yang benar untuk alur normal", async () => {
    const order: string[] = [];
    const { callbacks } = makeCallbacks({
      onStep: (label) => order.push(`step:${label}`),
      onResult: () => order.push("result"),
    });

    const response = makeStreamResponse([
      JSON.stringify({ event: "step", label: "Langkah 1", detail: "" }),
      JSON.stringify({ event: "step", label: "Langkah 2", detail: "" }),
      JSON.stringify({ event: "step", label: "Selesai", detail: "" }),
      JSON.stringify({
        event: "result",
        recommendations: [{ hsCode: "847130", description: "Laptop", confidence: "high", rationale: null, quotedRule: null }],
        coverageMap: { chapters: {}, hasUnvalidated: false },
      }),
    ]);

    await readChatStream(response, callbacks);

    expect(order).toEqual(["step:Langkah 1", "step:Langkah 2", "step:Selesai", "result"]);
  });

  test("skip baris kosong dan baris JSON tidak valid tanpa crash", async () => {
    const { callbacks, calls } = makeCallbacks();
    const response = makeStreamResponse([
      "",
      "   ",
      "bukan json",
      JSON.stringify({ event: "step", label: "Valid", detail: "ok" }),
    ]);

    await expect(readChatStream(response, callbacks)).resolves.not.toThrow();
    expect(calls.onStep).toHaveLength(1);
    expect(calls.onStep[0]).toEqual(["Valid", "ok"]);
  });

  test("confidence tidak valid di-fallback ke 'low'", async () => {
    const { callbacks, calls } = makeCallbacks();
    const response = makeStreamResponse([
      JSON.stringify({
        event: "result",
        recommendations: [
          { hsCode: "847130", description: "Test", confidence: "unknown_value", rationale: null, quotedRule: null },
        ],
        coverageMap: null,
      }),
    ]);

    await readChatStream(response, callbacks);

    const [recs] = calls.onResult[0] as [Record<string, unknown>[], unknown];
    expect(recs[0].confidence).toBe("low");
  });

  test("coverageMap null jika field tidak valid", async () => {
    const { callbacks, calls } = makeCallbacks();
    const response = makeStreamResponse([
      JSON.stringify({
        event: "result",
        recommendations: [],
        coverageMap: "bukan object",
      }),
    ]);

    await readChatStream(response, callbacks);

    const [, map] = calls.onResult[0] as [unknown[], unknown];
    expect(map).toBeNull();
  });

  test("memproses event result terakhir walau tanpa newline penutup", async () => {
    const { callbacks, calls } = makeCallbacks();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({
              event: "result",
              recommendations: [],
              coverageMap: { chapters: {}, hasUnvalidated: false },
            }),
          ),
        );
        controller.close();
      },
    });

    await readChatStream(new Response(stream), callbacks);

    expect(calls.onResult).toHaveLength(1);
  });
});
