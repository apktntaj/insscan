"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { FileUpIcon, RefreshCwIcon } from "lucide-react";
import {
  shipmentNumberPrefix,
  type CreateShipmentInput,
  type EditShipmentInput,
} from "@core/shipments/domain/shipment";
import type { UseCaseResult } from "@core/shipments/use-cases/result";
import type { ShipmentViewModel } from "../../adapters/presenters/shipment.presenter";
import { createUsageTrackerService } from "@/app/features/bl-extraction/infrastructure/usage-tracker.service";
import { extractBlViaApi } from "@/app/features/bl-extraction/infrastructure/bl-extraction-api.service";
import { toFormDataFromGemini } from "@/app/features/bl-extraction/adapters/form-filler.service";
import { parsePDF } from "@/app/features/bl-extraction/infrastructure/pdf-parser.service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  blNumber: string;
  shipperName: string;
  consigneeName: string;
  vesselName: string;
  voyage: string;
  portOfLoading: string;
  portOfDischarge: string;
  eta: string;
  customNotificationDate: string;
  alias: string;
  notes: string;
};
type FieldName = keyof FormState;
type FormErrors = Partial<Record<FieldName, string>>;
type SmartFillStatus = "processing" | "done" | "error" | null;
type SmartFillPayload = Partial<FormState> & { _confidenceScores?: Partial<Record<FieldName, number>> };

interface UsageTracker {
  canExtract(): Promise<{ ok: true } | { ok: false; error: { message: string } }>;
  incrementUsage(): Promise<void>;
}

const EMPTY_FORM: FormState = {
  blNumber: "", shipperName: "", consigneeName: "", vesselName: "", voyage: "",
  portOfLoading: "", portOfDischarge: "", eta: "", customNotificationDate: "", alias: "", notes: "",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateShipmentInput | EditShipmentInput) => Promise<UseCaseResult<unknown>>;
  initialData?: ShipmentViewModel;
  isEditMode?: boolean;
}

function confidenceLabel(value: number): string {
  if (value < 0.3) return "Rendah";
  if (value < 0.5) return "Sedang";
  return "Tinggi";
}

function TextField({ name, label, form, errors, onChange, required, readOnly, type = "text", confidence, description }: {
  name: FieldName;
  label: string;
  form: FormState;
  errors: FormErrors;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  readOnly?: boolean;
  type?: "text" | "date";
  confidence?: number;
  description?: string;
}) {
  const errorId = `${name}-error`;
  return (
    <Field data-invalid={Boolean(errors[name])} data-disabled={readOnly || undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel htmlFor={name}>{label}{required ? " *" : ""}</FieldLabel>
        {confidence !== undefined && <Badge variant={confidence < 0.3 ? "destructive" : confidence < 0.5 ? "secondary" : "outline"}>Kepercayaan {confidenceLabel(confidence)} · {Math.round(confidence * 100)}%</Badge>}
      </div>
      <Input id={name} name={name} type={type} value={form[name]} onChange={onChange} readOnly={readOnly} required={required} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? errorId : undefined} />
      {description && <FieldDescription>{description}</FieldDescription>}
      {errors[name] && <FieldError id={errorId}>{errors[name]}</FieldError>}
    </Field>
  );
}

export default function ShipmentForm({ isOpen, onClose, onSubmit, initialData, isEditMode = false }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [smartFillStatus, setSmartFillStatus] = useState<SmartFillStatus>(null);
  const [smartFillMessage, setSmartFillMessage] = useState("");
  const [confidenceScores, setConfidenceScores] = useState<Partial<Record<FieldName, number>>>({});
  const pdfInput = useRef<HTMLInputElement>(null);
  const formElement = useRef<HTMLFormElement>(null);
  const usageTracker = useRef(createUsageTrackerService() as UsageTracker);

  useEffect(() => {
    if (!isOpen) return;
    setForm(initialData && isEditMode ? {
      blNumber: initialData.blNumber,
      shipperName: initialData.shipperName,
      consigneeName: initialData.consigneeName,
      vesselName: initialData.vesselName ?? "",
      voyage: initialData.voyage ?? "",
      portOfLoading: initialData.portOfLoading ?? "",
      portOfDischarge: initialData.portOfDischarge ?? "",
      eta: initialData.eta,
      customNotificationDate: initialData.customNotificationDate ?? "",
      alias: initialData.alias ?? "",
      notes: initialData.notes ?? "",
    } : EMPTY_FORM);
    setErrors({});
    setSubmitError(null);
    setSmartFillStatus(null);
    setSmartFillMessage("");
    setConfidenceScores({});
  }, [initialData, isEditMode, isOpen]);

  function changeInput(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const name = event.target.name as FieldName;
    const value = event.target.type === "date" || name === "notes" ? event.target.value : event.target.value.toUpperCase();
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function smartFill(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const allowance = await usageTracker.current.canExtract();
    if (!allowance.ok) {
      setSmartFillStatus("error");
      setSmartFillMessage(allowance.error.message);
      return;
    }
    setSmartFillStatus("processing");
    setSmartFillMessage("Smart scan berjalan...");
    try {
      const parsedPdf = await parsePDF(file);
      if (!parsedPdf.ok) throw new Error(parsedPdf.message);
      const result = await extractBlViaApi(parsedPdf.text, file);
      if (!result.ok) {
        const messages: Record<string, string> = {
          INVALID_API_KEY: "Ada masalah dengan sistem. Hubungi admin.", TIMEOUT: "Koneksi terputus. Coba lagi.",
          RATE_LIMIT_EXCEEDED: "Terlalu banyak permintaan. Tunggu sebentar.", DAILY_LIMIT_REACHED: "Batas harian tercapai (5 BL/hari). Coba lagi besok.",
          INVALID_RESPONSE_FORMAT: "File tidak bisa dibaca. Coba file lain.", API_ERROR: "Koneksi terputus. Coba lagi.",
        };
        throw new Error(messages[result.error?.code] ?? "File tidak bisa dibaca. Isi manual.");
      }
      const extracted = toFormDataFromGemini(result.data) as SmartFillPayload;
      if (result.data.extractionMethod === "gemini") await usageTracker.current.incrementUsage();
      setForm((current) => {
        const merged = { ...current };
        for (const name of ["blNumber", "shipperName", "consigneeName", "vesselName", "voyage", "portOfLoading", "portOfDischarge", "eta"] as FieldName[]) {
          if (!current[name].trim() && extracted[name]) merged[name] = extracted[name] as string;
        }
        return merged;
      });
      setConfidenceScores(extracted._confidenceScores ?? {});
      const confidence = result.data.overallConfidence ?? 0;
      setSmartFillStatus("done");
      setSmartFillMessage(confidence >= 0.5 ? "Form berhasil diisi otomatis. Periksa kembali sebelum menyimpan." : "Data berhasil diambil dengan kepercayaan rendah. Periksa setiap field.");
    } catch (error) {
      setSmartFillStatus("error");
      setSmartFillMessage(error instanceof Error ? error.message : "File tidak bisa dibaca. Coba file lain atau isi manual.");
    }
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!isEditMode && !form.blNumber.trim()) next.blNumber = "Nomor B/L wajib diisi.";
    if (!form.shipperName.trim()) next.shipperName = "Nama shipper wajib diisi.";
    if (!form.consigneeName.trim()) next.consigneeName = "Nama consignee wajib diisi.";
    if (!form.eta.trim()) next.eta = "ETA wajib diisi.";
    return next;
  }

  function focusFirstInvalid() {
    requestAnimationFrame(() => formElement.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length) {
      setErrors(validation);
      focusFirstInvalid();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const common: EditShipmentInput = {
      shipperName: form.shipperName, consigneeName: form.consigneeName, eta: form.eta,
      vesselName: form.vesselName || null, voyage: form.voyage || null,
      portOfLoading: form.portOfLoading || null, portOfDischarge: form.portOfDischarge || null,
      customNotificationDate: form.customNotificationDate || null, alias: form.alias || null, notes: form.notes || null,
    };
    try {
      const result = await onSubmit(isEditMode ? common : { ...common, blNumber: form.blNumber });
      if (result.ok) {
        onClose();
      } else if (result.error.field && result.error.field in form) {
        setErrors({ [result.error.field]: result.error.message });
        focusFirstInvalid();
      } else if (result.error.fields?.length) {
        setErrors(Object.fromEntries(result.error.fields.map((field) => [field, result.error.message])) as FormErrors);
        focusFirstInvalid();
      } else {
        setSubmitError(result.error.message);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Shipment gagal disimpan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  const preview = form.consigneeName.trim() ? `${shipmentNumberPrefix(form.consigneeName, new Date())}???` : "—";
  const fieldProps = { form, errors, onChange: changeInput };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && !submitting && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-2xl">
        <SheetHeader><SheetTitle>{isEditMode ? "Edit shipment" : "Shipment baru"}</SheetTitle><SheetDescription>{isEditMode ? "Nomor shipment dan B/L tidak dapat diubah." : `Preview nomor shipment: ${preview}. Serial final dialokasikan saat disimpan.`}</SheetDescription></SheetHeader>
        <form ref={formElement} onSubmit={submit} className="flex flex-col gap-6 px-4" noValidate>
          {!isEditMode && <Field><input ref={pdfInput} type="file" accept="application/pdf" className="sr-only" onChange={(event) => void smartFill(event)} /><Button type="button" variant="outline" onClick={() => pdfInput.current?.click()} disabled={smartFillStatus === "processing"}>{smartFillStatus === "processing" ? <Spinner data-icon="inline-start" /> : <FileUpIcon data-icon="inline-start" />}Isi otomatis dari PDF</Button>{smartFillStatus && <Alert variant={smartFillStatus === "error" ? "destructive" : "default"}><AlertDescription>{smartFillMessage}</AlertDescription>{smartFillStatus !== "processing" && <Button type="button" variant="ghost" size="sm" onClick={() => pdfInput.current?.click()}><RefreshCwIcon data-icon="inline-start" />{smartFillStatus === "done" ? "Ganti PDF" : "Coba lagi"}</Button>}</Alert>}</Field>}

          <FieldSet><FieldLegend>Identitas</FieldLegend><FieldGroup><TextField name="blNumber" label="Nomor B/L" required={!isEditMode} readOnly={isEditMode} confidence={confidenceScores.blNumber} {...fieldProps} />{isEditMode && <Field><FieldLabel htmlFor="shipmentNumber">Nomor shipment</FieldLabel><Input id="shipmentNumber" value={initialData?.shipmentNumber ?? ""} readOnly /></Field>}<div className="grid gap-4 sm:grid-cols-2"><TextField name="shipperName" label="Nama shipper" required confidence={confidenceScores.shipperName} {...fieldProps} /><TextField name="consigneeName" label="Nama consignee" required confidence={confidenceScores.consigneeName} {...fieldProps} /></div><TextField name="alias" label="Alias" {...fieldProps} /></FieldGroup></FieldSet>

          <FieldSet><FieldLegend>Pelayaran & rute</FieldLegend><FieldGroup><div className="grid gap-4 sm:grid-cols-2"><TextField name="vesselName" label="Nama kapal" confidence={confidenceScores.vesselName} {...fieldProps} /><TextField name="voyage" label="Voyage" confidence={confidenceScores.voyage} {...fieldProps} /><TextField name="portOfLoading" label="Pelabuhan muat" confidence={confidenceScores.portOfLoading} {...fieldProps} /><TextField name="portOfDischarge" label="Pelabuhan bongkar" confidence={confidenceScores.portOfDischarge} {...fieldProps} /></div></FieldGroup></FieldSet>

          <FieldSet><FieldLegend>Jadwal & pengingat</FieldLegend><FieldGroup><div className="grid gap-4 sm:grid-cols-2"><TextField name="eta" label="ETA" type="date" required confidence={confidenceScores.eta} {...fieldProps} /><TextField name="customNotificationDate" label="Tanggal pengingat" type="date" description="Pengingat muncul tepat pada tanggal ini dan tetap aktif bila terlewat." {...fieldProps} /></div></FieldGroup></FieldSet>

          <FieldSet><FieldLegend>Catatan</FieldLegend><FieldGroup><Field><FieldLabel htmlFor="notes">Catatan</FieldLabel><Textarea id="notes" name="notes" value={form.notes} onChange={changeInput} rows={4} placeholder="Catatan tambahan" /></Field></FieldGroup></FieldSet>
          {submitError && <Alert variant="destructive"><AlertDescription>{submitError}</AlertDescription></Alert>}
          <SheetFooter className="px-0"><Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Batal</Button><Button type="submit" disabled={submitting}>{submitting && <Spinner data-icon="inline-start" />}{submitting ? "Menyimpan..." : isEditMode ? "Simpan perubahan" : "Buat shipment"}</Button></SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
