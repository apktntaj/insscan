// import { utils, writeFile } from "xlsx";

import {
  getDataColumInSheet,
  fetchAllData,
  //   generateBarangTarif,
} from "./excel";

export async function dataINSW() {
  //   const res = [];

  // Ambil data hs code dari bup
  const listHSCode = getDataColumInSheet("Barang", "POS TARIF");

  // periksa melalui insw
  const daftarTarif = await fetchAllData(listHSCode);

  //   const daftarTarif2 = generateBarangTarif(daftarTarif);

  //   // Ubah ke file excel hasil dari kumpulan tarif yang telah di
  //   const worksheet = utils.json_to_sheet(daftarTarif);
  //   const workbook = utils.book_new();
  //   utils.book_append_sheet(workbook, worksheet, "Tarif");
  //   utils.sheet_add_aoa(
  //     worksheet,
  //     [
  //       [
  //         "HS Code",
  //         "BM",
  //         "PPN",
  //         "PPH",
  //         "lartas_import",
  //         "lartas_border",
  //         "lartas_post_border",
  //         "lartas_export",
  //       ],
  //     ],
  //     { origin: "A1" }
  //   );

  //   writeFile(workbook, "Tarif.xlsx");

  //   // Tarif barang
  //   const worksheet2 = utils.json_to_sheet(daftarTarif2);
  //   const workbook2 = utils.book_new();
  //   utils.book_append_sheet(workbook2, worksheet2, "Tarif");
  //   utils.sheet_add_aoa(
  //     worksheet2,
  //     [["NO AJU", "SERI BARANG", "JENIS TARIF", "KODE FASILITAS", "TARIF"]],
  //     { origin: "A1" }
  //   );

  //   writeFile(workbook2, "tarifBarang.xlsx");
  return daftarTarif;
}
