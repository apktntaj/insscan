import type { Requirement } from "@core/cek-lartas/domain";
import type { Source, SourceResult } from "@core/cek-lartas/source";
import { inswApiGateway } from "./legacy-insw-api.service";

type ExternalDetail = Record<string, unknown>;

type LegacyInswResult = {
  sourceError?: boolean;
  lartasVerified?: boolean;
  lartasBorderDetails?: ExternalDetail[];
  lartasPostBorderDetails?: ExternalDetail[];
  lartasExportDetails?: ExternalDetail[];
};

interface LegacyInswGateway {
  fetchByCode(hsCode: string): Promise<LegacyInswResult | null>;
}

export function createInswSource(
  gateway: LegacyInswGateway = inswApiGateway as LegacyInswGateway,
): Source {
  return {
    async find(hsCode): Promise<SourceResult> {
      const result = await gateway.fetchByCode(hsCode);

      if (!result) return { status: "tidak-ditemukan" };
      if (result.sourceError) throw new Error("INSW source failed");
      if (result.lartasVerified !== true) {
        return { status: "belum-terverifikasi" };
      }

      return {
        status: "ditemukan",
        requirements: [
          ...mapRequirements(result.lartasBorderDetails, "Impor Border"),
          ...mapRequirements(
            result.lartasPostBorderDetails,
            "Impor Post Border",
          ),
          ...mapRequirements(result.lartasExportDetails, "Ekspor Border"),
        ],
      };
    },
  };
}

function mapRequirements(
  details: ExternalDetail[] | undefined,
  category: Requirement["category"],
): Requirement[] {
  if (!Array.isArray(details)) return [];

  return details.map((detail) => ({
    category,
    idDokumen: optionalString(detail.idDokumen),
    kodeIzin: optionalString(detail.kodeIzin),
    namaIzin: optionalString(detail.namaIzin),
    komoditi: optionalString(detail.komoditi),
    noSkep: optionalString(detail.noSkep),
    uraianBarangSkep: optionalString(detail.uraianBarangSkep),
    tanggalMulai: optionalString(detail.tanggalMulai),
    tanggalAkhir: optionalString(detail.tanggalAkhir),
    link: optionalString(detail.link),
    links: stringArray(detail.links),
    dokumenPabean: stringArray(detail.dokumenPabean),
  }));
}

function optionalString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}
