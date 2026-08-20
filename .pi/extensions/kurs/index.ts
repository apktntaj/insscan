import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import {
	fetchCurrentTaxRates,
	formatTaxRates,
	type CurrentTaxRates,
} from "./tax-rates";

const ENTRY_TYPE = "current-kemenkeu-tax-rates";
const STATUS_ID = "kurs";

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
}

export default function kursExtension(pi: ExtensionAPI): void {
	pi.registerEntryRenderer(ENTRY_TYPE, (entry, _options, theme) => {
		const lines = formatTaxRates(entry.data as CurrentTaxRates);
		const content = [
			theme.fg("accent", theme.bold(lines[0] ?? "Kurs Pajak Kemenkeu")),
			theme.fg("muted", lines[1] ?? ""),
			...lines.slice(2, -1).map((line) => theme.fg("text", line)),
			theme.fg("dim", lines.at(-1) ?? ""),
		].join("\n");
		return new Text(content, 1, 0);
	});

	pi.registerCommand("kurs", {
		description: "Tampilkan kurs pajak Kemenkeu yang sedang berlaku",
		handler: async (_args, ctx) => {
			if (ctx.hasUI) {
				ctx.ui.setStatus(STATUS_ID, "Mengambil kurs pajak Kemenkeu…");
			}

			try {
				const data = await fetchCurrentTaxRates();
				const output = formatTaxRates(data).join("\n");

				if (ctx.mode === "tui") {
					pi.appendEntry(ENTRY_TYPE, data);
				} else if (ctx.hasUI) {
					ctx.ui.notify(output, "info");
				} else {
					console.log(output);
				}
			} catch (error) {
				const message = `Gagal mengambil kurs pajak: ${errorMessage(error)}`;
				if (ctx.hasUI) {
					ctx.ui.notify(message, "error");
				} else {
					console.error(message);
				}
			} finally {
				if (ctx.hasUI) {
					ctx.ui.setStatus(STATUS_ID, undefined);
				}
			}
		},
	});
}
