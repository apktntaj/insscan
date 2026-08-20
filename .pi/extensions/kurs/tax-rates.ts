const KEMENKEU_TAX_RATE_URL = "https://fiskal.kemenkeu.go.id/informasi-publik/kurs-pajak";
const REQUEST_TIMEOUT_MS = 10_000;

export const DISPLAY_CURRENCIES = ["USD", "EUR", "SGD", "JPY", "CNY", "MYR", "AUD"] as const;

export type CurrencyCode = (typeof DISPLAY_CURRENCIES)[number];

export interface TaxRate {
	currency: CurrencyCode;
	idrValue: number;
	foreignCurrencyUnits: number;
}

export interface CurrentTaxRates {
	kmkNumber: string;
	validFrom: string;
	validUntil: string;
	effectiveDate: string;
	rates: TaxRate[];
	sourceUrl: string;
}

type HtmlResponse = {
	ok: boolean;
	status: number;
	text(): Promise<string>;
};

type Fetcher = (url: string, init: RequestInit) => Promise<HtmlResponse>;

function parseIndonesianNumber(value: string): number {
	const parsed = Number(value.replaceAll(".", "").replace(",", "."));
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new Error(`Nilai kurs tidak valid: ${value}`);
	}
	return parsed;
}

function parseDocumentMetadata(html: string): Pick<CurrentTaxRates, "kmkNumber" | "validFrom" | "validUntil"> {
	const kmkMatch = html.match(/<strong>\s*KMK Nomor\s+([^<]+)<\/strong>/i);
	const periodMatch = html.match(/Tanggal berlaku:\s*([^<]+)</i);
	if (!kmkMatch?.[1] || !periodMatch?.[1]) {
		throw new Error("Nomor KMK atau periode berlaku tidak ditemukan.");
	}

	const kmkNumber = kmkMatch[1].trim();
	const periodParts = periodMatch[1].trim().split(/\s+-\s+/);
	if (!/^[A-Za-z0-9./-]+$/.test(kmkNumber) || periodParts.length !== 2) {
		throw new Error("Metadata KMK pada halaman Kemenkeu tidak valid.");
	}

	const [validFrom, validUntil] = periodParts;
	const datePattern = /^\d{2} [A-Za-z]+ \d{4}$/;
	if (!validFrom || !validUntil || !datePattern.test(validFrom) || !datePattern.test(validUntil)) {
		throw new Error("Periode berlaku KMK pada halaman Kemenkeu tidak valid.");
	}

	return { kmkNumber, validFrom, validUntil };
}

/** Parse the public DJSEF Kemenkeu table. JPY is officially quoted per 100 yen. */
export function parseKemenkeuTaxRates(html: string, effectiveDate: string): CurrentTaxRates {
	const metadata = parseDocumentMetadata(html);
	const values = new Map<string, number>();
	const rows = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];

	for (const row of rows) {
		const currencyMatch = row.match(/<span\s+class=['"]hidden-xs['"]>[^<]*\(([A-Z]{3})\)<\/span>/i);
		const valueMatch = row.match(/<div\s+class=['"]m-l-5['"]>\s*([\d.,]+)\s*<\/div>/i);
		if (currencyMatch?.[1] && valueMatch?.[1]) {
			values.set(currencyMatch[1].toUpperCase(), parseIndonesianNumber(valueMatch[1]));
		}
	}

	const rates = DISPLAY_CURRENCIES.map((currency): TaxRate => {
		const idrValue = values.get(currency);
		if (idrValue === undefined) {
			throw new Error(`Kurs pajak ${currency} tidak ditemukan pada halaman Kemenkeu.`);
		}
		return {
			currency,
			idrValue,
			foreignCurrencyUnits: currency === "JPY" ? 100 : 1,
		};
	});

	const query = new URLSearchParams({ date: effectiveDate });
	return {
		...metadata,
		effectiveDate,
		rates,
		sourceUrl: `${KEMENKEU_TAX_RATE_URL}?${query}`,
	};
}

export function currentJakartaDate(now: Date = new Date()): string {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "Asia/Jakarta",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(now);
	const getPart = (type: Intl.DateTimeFormatPartTypes): string => parts.find((part) => part.type === type)?.value ?? "";
	return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

export async function fetchCurrentTaxRates(
	effectiveDate: string = currentJakartaDate(),
	fetcher: Fetcher = fetch,
): Promise<CurrentTaxRates> {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
		throw new Error("Tanggal kurs pajak harus menggunakan format YYYY-MM-DD.");
	}

	const query = new URLSearchParams({ date: effectiveDate });
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetcher(`${KEMENKEU_TAX_RATE_URL}?${query}`, {
			headers: { accept: "text/html" },
			signal: controller.signal,
		});
		if (!response.ok) {
			throw new Error(`Situs Kemenkeu merespons HTTP ${response.status}.`);
		}
		return parseKemenkeuTaxRates(await response.text(), effectiveDate);
	} catch (error) {
		if (controller.signal.aborted) {
			throw new Error("Permintaan data kurs pajak melewati batas waktu 10 detik.");
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

const idrFormatter = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

export function formatTaxRates(data: CurrentTaxRates): string[] {
	return [
		`Kurs Pajak Kemenkeu — KMK Nomor ${data.kmkNumber}`,
		`Berlaku: ${data.validFrom} - ${data.validUntil}`,
		...data.rates.map(
			({ currency, idrValue, foreignCurrencyUnits }) =>
				`${foreignCurrencyUnits} ${currency} = ${idrFormatter.format(idrValue)}`,
		),
		`Sumber resmi: DJSEF Kementerian Keuangan — ${data.sourceUrl}`,
	];
}
