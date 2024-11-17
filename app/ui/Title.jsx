import React from "react";

export default function Title({ title }) {
  return (
    <h1 className='text-4xl font-extrabold text-gray-600 text-center mb-6'>
      {title}
    </h1>
  );
}
