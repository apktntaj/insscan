// Route js save data to excel file and serve it to the client

const axios = require("axios");

export async function POST(req) {
  const body = await req.json();
  const hsCodes = body.map((item) => item["hs_code"]);

  fetchAll([...new Set(hsCodes)]).then((items) => {
    const cleanResult = items.filter((item) => item !== undefined);
    const toPrint = hsCodes.map((hs) => {
      const foundItem = cleanResult.find((item) => item["HS Code"] === hs);
      if (foundItem) {
        return {
          "HS Code": hs,
          BM: foundItem["BM"],
          PPN: foundItem["PPN"],
          PPH: foundItem["PPH"],
        };
      } else {
        return {
          "HS Code": hs,
          BM: "tidak ada data",
          PPN: "tidak ada data",
          PPH: "tidak ada data",
        };
      }
    });
    console.table(toPrint);
  });

  return new Response("selesai");
}

async function fetchAll(arr) {
  const janjiku = arr.map((hs) => dataINTR(hs));
  const results = await Promise.all(janjiku);

  return results;
}

async function dataINTR(hsCode) {
  try {
    const response = await axios.get(
      `https://api.insw.go.id/api-prod-ba/ref/hscode/komoditas?hs_code=${hsCode}`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-US,en;q=0.9",
          authorization: "Basic aW5zd18yOmJhYzJiYXM2",
          "sec-ch-ua":
            '"Not/A)Brand";v="99", "Microsoft Edge";v="115", "Chromium";v="115"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          Referer: "https://insw.go.id/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );

    const html = response.data;
    const data = html.data[0];

    let res = {};
    res["HS Code"] = hsCode; // diisi based on data array pos tarif

    // TARIF
    res["BM"] = data["new_mfn"][0]["bm"][0]["bm"];
    res["PPN"] = data["new_mfn"][0]["ppn"][0]["ppn"];
    res["PPH"] = data["new_mfn"][0]["pph"][0]["pph"];

    // LARTAS
    res["lartas_import"] = data.import_regulation.length ? "1" : "0";
    res["lartas_border"] = data.import_regulation_border.length ? "1" : "0";
    res["lartas_post_border"] = data.import_regulation_post_border.length
      ? "1"
      : "0";
    res["lartas_export"] = data.export_regulation.length ? "1" : "0";

    return res;
  } catch (error) {
    console.error("Error: ", error);
  }
}
