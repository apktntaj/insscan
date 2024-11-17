import React from "react";

export default function TemplateExcelLink() {
  return (
    <p className="text-center text-slate-600">
      Unduh contoh file Excel di
      <a
        className="text-blue-600-500 font-semibold drop-shadow-md tracking-wider"
        href="cek-tarif.xlsx"
        download
      >
        {" "}
        sini
      </a>
    </p>
  );
}
