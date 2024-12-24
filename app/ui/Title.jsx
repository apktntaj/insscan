import React from "react";

export default function Title() {
  return (
    <div className='container px-4'>
      <h1 className='text-4xl font-extrabold drop-shadow-md tracking-wider text-gray-600 text-center my-3'>
        INSScang
      </h1>
      <div className='text-center text-gray-600 text-lg'>
        <p>
          Melakukan scanning data hs code pada invoice secara otomatis dan
          mencarikan info pajak dan lartas.
        </p>
        <p className='mb-5'>
          Cukup Upload file invoice, kami akan mencari data pajak jika ada item
          hs code yang terdeteksi oleh AI kami.
        </p>
      </div>
    </div>
  );
}
