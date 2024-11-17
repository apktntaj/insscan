import React from "react";

export default function Title() {
  return (
    <div>
      <h1 className='text-4xl font-extrabold drop-shadow-md tracking-wider text-gray-600 text-center mb-6'>
        INSScan
      </h1>
      <div className='text-center text-gray-600 text-lg'>
        <p>
          Solusi otomatis untuk mengambil data pajak situs INSW berdasarkan
          kumpulan HS Code dari Invoice.
        </p>
        <p className='mb-5'>
          Anda cukup masukkan file invoice, lalu kami akan mencari data pajak
          jika ada item HS Code yang terdeteksi oleh AI kami.
        </p>
      </div>
    </div>
  );
}
