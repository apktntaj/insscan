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
      <div className="flex flex-col items-center gap-3 px-4 py-5 text-center">
        <div className="max-w-xl">
          <p className="text-sm font-medium">Mode pemeriksaan</p>
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
          className="justify-center"
        >
          <ToggleGroupItem
            value="file"
            aria-label="Upload Excel"
            className="data-[pressed]:border-primary data-[pressed]:bg-primary data-[pressed]:text-primary-foreground data-[pressed]:shadow-sm data-[pressed]:hover:bg-primary/90"
          >
            <FileSpreadsheetIcon />
            Bulk
          </ToggleGroupItem>
          <ToggleGroupItem
            value="single"
            aria-label="Satu HS Code"
            className="data-[pressed]:border-primary data-[pressed]:bg-primary data-[pressed]:text-primary-foreground data-[pressed]:shadow-sm data-[pressed]:hover:bg-primary/90"
          >
            <HashIcon />
            Single
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {mode === "file" ? <FileInputPanel /> : <SingleInputPanel />}
    </div>
  );
}
