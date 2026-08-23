"use client";

import type { ChangeEventHandler } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input as ShadcnInput } from "@/components/ui/input";

interface FileInputProps {
  handleChange: ChangeEventHandler<HTMLInputElement>;
  accept?: string;
  className?: string;
  ariaLabel?: string;
  selectedFileName?: string;
  placeholder?: string;
}

export default function Input({
  handleChange,
  accept = ".xls,.xlsx",
  className,
  ariaLabel = "Pilih file Excel (.xls, .xlsx)",
  selectedFileName = "",
  placeholder = "Pilih invoice dalam format Excel",
}: FileInputProps) {
  return (
    <Field>
      <FieldLabel className="sr-only">{ariaLabel}</FieldLabel>
      <ShadcnInput
        type="file"
        accept={accept}
        aria-label={ariaLabel}
        className={className}
        onChange={handleChange}
      />
      <FieldDescription>{selectedFileName || placeholder}</FieldDescription>
    </Field>
  );
}
