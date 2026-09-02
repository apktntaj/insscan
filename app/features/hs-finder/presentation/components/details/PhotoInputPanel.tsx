"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PhotoInputPanelProps {
  onPhotoSelected: (file: File) => void;
  busy?: boolean;
}

export default function PhotoInputPanel({ onPhotoSelected, busy = false }: PhotoInputPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function selectFile(nextFile: File | undefined): void {
    if (!nextFile) return;
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
  }

  function clearFile(): void {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return <Card>
    <CardHeader><CardTitle>Unggah foto barang</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <div
        className="flex min-h-40 cursor-pointer items-center justify-center rounded-md border-2 border-dashed p-4"
        onClick={() => fileRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]); }}
      >
        {preview ? <img src={preview} alt="Pratinjau barang" className="max-h-40 object-contain" /> : <p className="text-sm text-muted-foreground">Tarik foto atau klik untuk memilih</p>}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => selectFile(event.target.files?.[0])} />
      </div>
      <div className="flex gap-2">
        <Button type="button" disabled={!file || busy} onClick={() => file && onPhotoSelected(file)}>{busy ? "Mengidentifikasi…" : "Identifikasi foto"}</Button>
        <Button type="button" variant="outline" disabled={!file || busy} onClick={clearFile}>Hapus</Button>
      </div>
    </CardContent>
  </Card>;
}
