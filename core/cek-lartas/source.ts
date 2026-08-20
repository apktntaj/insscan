import type { HsCode, Requirement } from "./domain";

export type SourceResult =
  | { status: "ditemukan"; requirements: Requirement[] }
  | { status: "tidak-ditemukan" }
  | { status: "belum-terverifikasi" };

/** Boundary yang harus dipenuhi oleh sumber data LARTAS. */
export interface Source {
  find(hsCode: HsCode): Promise<SourceResult>;
}
