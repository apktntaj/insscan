import { createFindHsCodeUseCase } from "../find-hs-code.js";

const itemDescription = { text: "laptop portabel", source: "text" };

test("fails closed before classification when legal knowledge is incomplete", async () => {
  const hsFinderGeminiService = {
    identifyCandidateChapters: jest.fn().mockResolvedValue({ ok: true, data: ["84"] }),
    classifyWithNotes: jest.fn(),
  };
  const classificationKnowledge = {
    loadHs6Context: jest.fn().mockResolvedValue({
      edition: { id: "hs-2022", status: "scaffold" },
      chapterNotes: [{ chapterNumber: "84", status: "draft", content: "draft" }],
      coverageMap: { chapters: { "84": "draft" }, hasUnvalidated: true },
      isComplete: false,
    }),
  };

  const useCase = createFindHsCodeUseCase({ hsFinderGeminiService, classificationKnowledge });
  const result = await useCase.execute({ itemDescription });

  expect(result.ok).toBe(false);
  expect(result.errorCode).toBe("INSUFFICIENT_LEGAL_COVERAGE");
  expect(hsFinderGeminiService.classifyWithNotes).not.toHaveBeenCalled();
});

test("returns explicit HS6 and BTKI8 boundaries for complete knowledge", async () => {
  const classification = {
    hsCode: "847130",
    description: "Portable automatic data processing machines",
    reasoningPath: [],
    coverageMap: { chapters: { "84": "validated" }, hasUnvalidated: false },
  };
  const hsFinderGeminiService = {
    identifyCandidateChapters: jest.fn().mockResolvedValue({ ok: true, data: ["84"] }),
    classifyWithNotes: jest.fn().mockResolvedValue({ ok: true, data: classification }),
  };
  const classificationKnowledge = {
    loadHs6Context: jest.fn().mockResolvedValue({
      edition: { id: "hs-2022", status: "validated" },
      chapterNotes: [{ chapterNumber: "84", status: "validated", content: "legal text" }],
      coverageMap: { chapters: { "84": "validated" }, hasUnvalidated: false },
      isComplete: true,
    }),
  };

  const useCase = createFindHsCodeUseCase({ hsFinderGeminiService, classificationKnowledge });
  const result = await useCase.execute({ itemDescription });

  expect(result.ok).toBe(true);
  expect(result.data.hsCode).toBe("847130");
  expect(result.data.hs6).toEqual({ code: "847130", edition: "hs-2022" });
  expect(result.data.btki8).toBeNull();
});

test("returns targeted clarification before materially different classifications", async () => {
  const classification = {
    status: "needs_clarification",
    clarificationReason: "Fungsi utama membedakan Bab 84 dan 85.",
    questions: ["Apakah fungsi utama barang mengolah data atau komunikasi?"],
    recommendations: [],
    coverageMap: { chapters: { "84": "validated", "85": "validated" }, hasUnvalidated: false },
  };
  const hsFinderGeminiService = {
    identifyCandidateChapters: jest.fn().mockResolvedValue({ ok: true, data: ["84", "85"] }),
    classifyWithNotes: jest.fn().mockResolvedValue({ ok: true, data: classification }),
  };
  const classificationKnowledge = {
    loadHs6Context: jest.fn().mockResolvedValue({
      edition: { id: "hs-2022", status: "validated" },
      chapterNotes: [],
      coverageMap: classification.coverageMap,
      isComplete: true,
    }),
  };

  const useCase = createFindHsCodeUseCase({ hsFinderGeminiService, classificationKnowledge });
  const result = await useCase.execute({ itemDescription });

  expect(result.ok).toBe(true);
  expect(result.data.status).toBe("needs_clarification");
  expect(result.data.hs6).toBeNull();
});

test("returns several ranked recommendations without mandatory detail review", async () => {
  const recommendations = [
    {
      hsCode: "847130",
      description: "Mesin pengolah data portabel",
      confidence: "high",
      rationale: "Kandidat utama.",
    },
    {
      hsCode: "847141",
      description: "Mesin pengolah data lainnya",
      confidence: "medium",
      rationale: "Alternatif bila tidak memenuhi syarat portabel.",
    },
  ];
  const classification = {
    status: "recommendations",
    clarificationReason: null,
    questions: [],
    recommendations,
    coverageMap: { chapters: { "84": "validated" }, hasUnvalidated: false },
  };
  const hsFinderGeminiService = {
    identifyCandidateChapters: jest.fn().mockResolvedValue({ ok: true, data: ["84"] }),
    classifyWithNotes: jest.fn().mockResolvedValue({ ok: true, data: classification }),
  };
  const classificationKnowledge = {
    loadHs6Context: jest.fn().mockResolvedValue({
      edition: { id: "hs-2022", status: "validated" },
      chapterNotes: [],
      coverageMap: classification.coverageMap,
      isComplete: true,
    }),
  };

  const useCase = createFindHsCodeUseCase({ hsFinderGeminiService, classificationKnowledge });
  const result = await useCase.execute({ itemDescription });

  expect(result.ok).toBe(true);
  expect(result.data.status).toBe("recommendations");
  expect(result.data.recommendations).toHaveLength(2);
  expect(result.data.hs6.code).toBe("847130");
});
