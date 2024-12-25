import React from "react";

export default function Title() {
  return (
    <div className='container px-4'>
      <h1 className='text-4xl font-extrabold drop-shadow-md tracking-wider text-gray-600 text-center my-3'>
        INSScan
      </h1>
      <div className='text-center text-gray-600 text-lg'>
        <p>AI-powered invoice scanner for instant HS code lookup and</p>
        <p className='mb-5'>
          retrieve realtime tax & restrictions goods regulation from Indonesia
          National Single Window (INSW) site.
        </p>
      </div>
    </div>
  );
}
