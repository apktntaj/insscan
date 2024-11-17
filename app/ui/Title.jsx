import React from "react";

export default function Title({ title }) {
  return (
    <div>
      <h1 className='text-4xl font-extrabold drop-shadow-md tracking-wider text-gray-600 text-center mb-6'>
        INSScan
      </h1>
      <div className='text-center text-gray-600 text-lg'>
        <p>
          Solusi otomatis untuk mengambil data pajak dan HS Code dari website
          INSW secara cepat dan efisien.
        </p>
        <p className='mb-5'>
          Dengan INSScan, Anda bisa memproses banyak data sekaligus dan
          mendapatkan hasil dalam format Excel.
        </p>
      </div>
    </div>
  );
}
