"use client";

import { useState, type FormEvent } from "react";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

const CHAR_MIN = 3;
const CHAR_MAX = 2000;
const GRI_DETAILS_MAX = 500;

interface TextInputPanelProps {
  onFind: (description: string) => void;
  initialValue?: string;
  busy?: boolean;
}

function buildClassificationText(description: string, griDetails: string): string {
  const normalizedDescription = description.trim();
  const normalizedDetails = griDetails.trim();
  return normalizedDetails
    ? `${normalizedDescription}\nInformasi komposisi/wadah/kemasan untuk KUM HS: ${normalizedDetails}`
    : normalizedDescription;
}

export default function TextInputPanel({
  onFind,
  initialValue = "",
  busy = false,
}: TextInputPanelProps) {
  const [text, setText] = useState(initialValue);
  const [griDetails, setGriDetails] = useState("");
  const [touched, setTouched] = useState(false);

  const classificationText = buildClassificationText(text, griDetails);
  const descriptionTooShort = text.trim().length < CHAR_MIN;
  const descriptionTooLong = classificationText.length > CHAR_MAX;
  const valid = !descriptionTooShort && !descriptionTooLong;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (valid) onFind(classificationText);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Jelaskan barang</CardTitle>
          <CardDescription>
            Semakin lengkap nama, bahan, fungsi, dan spesifikasi, semakin baik kandidat yang dapat dibandingkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={touched && descriptionTooShort ? true : undefined}>
              <FieldLabel htmlFor="product-description">Deskripsi barang</FieldLabel>
              <Textarea
                id="product-description"
                placeholder="Contoh: Mesin cuci otomatis rumah tangga, kapasitas 7 kg"
                value={text}
                maxLength={CHAR_MAX}
                disabled={busy}
                aria-invalid={touched && descriptionTooShort}
                onChange={(event) => setText(event.target.value)}
                onBlur={() => setTouched(true)}
                className="min-h-32"
              />
              {touched && descriptionTooShort ? (
                <FieldError>Deskripsi minimal {CHAR_MIN} karakter.</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={touched && descriptionTooLong ? true : undefined}>
              <FieldLabel htmlFor="gri-details">Bahan, wadah, atau kemasan (opsional)</FieldLabel>
              <FieldDescription>
                Tambahkan komposisi bahan, wadah khusus, atau kemasan yang dapat digunakan berulang kali bila relevan.
              </FieldDescription>
              <Textarea
                id="gri-details"
                placeholder="Contoh: 70% poliester, 30% katun; disertai casing khusus"
                value={griDetails}
                maxLength={GRI_DETAILS_MAX}
                disabled={busy}
                aria-invalid={touched && descriptionTooLong}
                onChange={(event) => setGriDetails(event.target.value)}
              />
              {touched && descriptionTooLong ? (
                <FieldError>Total informasi maksimum {CHAR_MAX.toLocaleString("id-ID")} karakter.</FieldError>
              ) : null}
              <FieldDescription className="text-right tabular-nums">
                {classificationText.length}/{CHAR_MAX}
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={!valid || busy}>
            {busy ? <Spinner data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
            {busy ? "Menganalisis…" : "Analisis barang"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
