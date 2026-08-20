import {
	DISPLAY_CURRENCIES,
	currentJakartaDate,
	fetchCurrentTaxRates,
	formatTaxRates,
	parseKemenkeuTaxRates,
} from "./tax-rates";

const rows: Record<string, string> = {
	USD: "17.960,00",
	EUR: "20.716,89",
	SGD: "14.014,80",
	JPY: "11.382,99",
	CNY: "2.661,06",
	MYR: "4.387,19",
	AUD: "12.644,50",
};

const validHtml = `
	<div class="informasi-document-meta">
		<p><strong>KMK Nomor 37/MK/EF.2/2026</strong></p>
		<p><em>Tanggal berlaku: 12 Agustus 2026 - 18 Agustus 2026</em></p>
	</div>
	<table><tbody>
		${Object.entries(rows)
			.map(
				([currency, value]) => `
				<tr class="table-bordered">
					<td><span class='hidden-xs'>Mata Uang (${currency})</span></td>
					<td><div class="m-l-5">${value}</div></td>
				</tr>`,
			)
			.join("\n")}
	</tbody></table>
`;

describe("parseKemenkeuTaxRates", () => {
	it("parses KMK metadata and Indonesian-formatted currency values", () => {
		const result = parseKemenkeuTaxRates(validHtml, "2026-08-18");

		expect(result.kmkNumber).toBe("37/MK/EF.2/2026");
		expect(result.validFrom).toBe("12 Agustus 2026");
		expect(result.validUntil).toBe("18 Agustus 2026");
		expect(result.rates.map((rate) => rate.currency)).toEqual(DISPLAY_CURRENCIES);
		expect(result.rates.find((rate) => rate.currency === "USD")?.idrValue).toBe(17960);
		expect(result.rates.find((rate) => rate.currency === "JPY")).toMatchObject({
			idrValue: 11382.99,
			foreignCurrencyUnits: 100,
		});
	});

	it("rejects an incomplete table instead of displaying stale or misleading data", () => {
		const htmlWithoutUsd = validHtml.replace(/<tr class="table-bordered">[\s\S]*?\(USD\)[\s\S]*?<\/tr>/, "");
		expect(() => parseKemenkeuTaxRates(htmlWithoutUsd, "2026-08-18")).toThrow(
			"Kurs pajak USD tidak ditemukan",
		);
	});

	it("rejects missing KMK metadata", () => {
		expect(() => parseKemenkeuTaxRates("<html></html>", "2026-08-18")).toThrow(
			"Nomor KMK atau periode berlaku tidak ditemukan",
		);
	});
});

describe("fetchCurrentTaxRates", () => {
	it("requests the official Kemenkeu page for the effective date", async () => {
		const fetcher = jest.fn().mockResolvedValue({
			ok: true,
			status: 200,
			text: async () => validHtml,
		});

		const result = await fetchCurrentTaxRates("2026-08-18", fetcher);

		expect(fetcher).toHaveBeenCalledWith(
			"https://fiskal.kemenkeu.go.id/informasi-publik/kurs-pajak?date=2026-08-18",
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
		expect(result.sourceUrl).toContain("fiskal.kemenkeu.go.id");
	});

	it("reports non-successful Kemenkeu responses", async () => {
		const fetcher = jest.fn().mockResolvedValue({
			ok: false,
			status: 503,
			text: async () => validHtml,
		});

		await expect(fetchCurrentTaxRates("2026-08-18", fetcher)).rejects.toThrow("HTTP 503");
	});
});

describe("currentJakartaDate", () => {
	it("uses the calendar date in Asia/Jakarta", () => {
		expect(currentJakartaDate(new Date("2026-08-18T17:30:00Z"))).toBe("2026-08-19");
	});
});

describe("formatTaxRates", () => {
	it("shows the KMK period, official rates, JPY unit, and Kemenkeu source", () => {
		const output = formatTaxRates(parseKemenkeuTaxRates(validHtml, "2026-08-18")).join("\n");

		expect(output).toContain("KMK Nomor 37/MK/EF.2/2026");
		expect(output).toContain("12 Agustus 2026 - 18 Agustus 2026");
		expect(output).toContain("1 USD = Rp");
		expect(output).toContain("100 JPY = Rp");
		expect(output).toContain("DJSEF Kementerian Keuangan");
	});
});
