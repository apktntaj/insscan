"use client";

import { useCekLartasSingle } from "@/app/features/cek-lartas/presentation/hooks/useCekLartasSingle";
import SingleResultCard from "@/app/features/cek-lartas/presentation/components/cek-lartas/SingleResultCard";
import Alert from "@/app/shared/components/Alert";
import PaywallBanner from "@/app/features/cek-lartas/presentation/components/cek-lartas/PaywallBanner";
import { SearchIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

/**
 * Resolves the Alert variant from a status string.
 *
 * @param {string} status
 * @returns {"success" | "error" | "warning" | "info"}
 */
function resolveAlertVariant(status) {
  if (!status) return "info";
  const lower = status.toLowerCase();
  if (lower.includes("berhasil") || lower.includes("disalin")) return "success";
  if (lower.includes("gagal") || lower.includes("tidak") || lower.includes("harus")) return "error";
  return "warning";
}

/**
 * Panel for Single Input mode of Cek Lartas.
 * Delegates all state and actions to useCekLartasSingle.
 */
export default function SingleInputPanel() {
  const {
    singleInput,
    setSingleInput,
    singleResult,
    singleStatus,
    isSingleLoading,
    handleFetch,
    handleCopy,
    handleExportSingle,
    remaining,
    isLimitReached,
    isPro,
    activateKey,
  } = useCekLartasSingle();

  const alertVariant = resolveAlertVariant(singleStatus);

  return (
    <div className="flex flex-col gap-4">
      {/* Paywall banner — tampil saat limit tercapai */}
      {isLimitReached ? <PaywallBanner onActivate={activateKey} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Periksa satu HS code</CardTitle>
          <CardDescription>
            Masukkan 8 digit tanpa titik, misalnya 84713090.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <InputGroup className="h-10">
            <InputGroupInput
              type="text"
              value={singleInput}
              onChange={(e) => setSingleInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFetch(); }}
              placeholder="84713090"
              aria-label="HS code 8 digit"
              disabled={isSingleLoading || isLimitReached}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                onClick={handleFetch}
                disabled={isSingleLoading || isLimitReached}
                aria-label="Cari HS code"
                title="Cari"
              >
                {isSingleLoading ? <Spinner /> : <SearchIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          <p className="text-xs leading-6 text-muted-foreground sm:text-sm">
            {isSingleLoading
              ? "Sedang mencari..."
              : !isPro && !isLimitReached
              ? `Sisa kuota hari ini: ${remaining} query`
              : ""}
          </p>
          {singleStatus ? <Alert message={singleStatus} variant={alertVariant} /> : null}
        </CardContent>
      </Card>

      {/* Result card */}
      {singleResult ? (
        <SingleResultCard
          row={singleResult}
          onCopy={handleCopy}
          onExport={handleExportSingle}
        />
      ) : null}
    </div>
  );
}
