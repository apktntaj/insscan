import React from "react";

export default function Title({ title, descs }) {
  return (
    <div className='container px-4'>
      <h1 className='text-4xl font-extrabold drop-shadow-md tracking-wider text-gray-600 text-center my-3'>
        {title}
      </h1>
      <div className='text-center text-gray-600 text-lg'>
        {descs.map((d, i) => (
          <p key={i}>{d}</p>
        ))}
      </div>
    </div>
  );
}
