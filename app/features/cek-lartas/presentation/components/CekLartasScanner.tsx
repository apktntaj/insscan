"use client";

import { useState } from "react";
import { FileSpreadsheetIcon, HashIcon } from "lucide-react";
import SingleInputPanel from "@/app/features/cek-lartas/presentation/components/cek-lartas/SingleInputPanel";
import FileInputPanel from "@/app/features/cek-lartas/presentation/components/cek-lartas/FileInputPanel";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ScannerMode = "file" | "single";

export default function CekLartasScanner() {
  const [mode, setMode] = useState<ScannerMode>("file");

  return (
    <div className="flex flex-col gap-5 overflow-x-clip">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Metode pemeriksaan</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Gunakan Excel untuk pekerjaan batch atau periksa satu HS code.
          </p>
        </div>
        <ToggleGroup
          value={[mode]}
          onValueChange={(value) => {
            const nextMode = value[0] as ScannerMode | undefined;
            if (nextMode) setMode(nextMode);
          }}
          variant="outline"
          aria-label="Pilih metode pemeriksaan"
        >
          <ToggleGroupItem value="file" aria-label="Upload Excel">
            <FileSpreadsheetIcon />
            Upload Excel
          </ToggleGroupItem>
          <ToggleGroupItem value="single" aria-label="Satu HS Code">
            <HashIcon />
            Satu HS Code
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {mode === "file" ? <FileInputPanel /> : <SingleInputPanel />}
    </div>
  );
}
