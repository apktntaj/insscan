"use client";

import React, { useState } from "react";

export default function Pagination({ items }) {
  const [forms, setForms] = useState(items);
  const [pointer, setPointer] = useState(0);

  const inc = () => {
    if (pointer === forms.length - 1) {
      setPointer(0);
    } else {
      setPointer(pointer + 1);
    }
  };

  const dec = () => {
    if (pointer === 0) {
      setPointer(items.length - 1);
    } else {
      setPointer(pointer - 1);
    }
  };

  return (
    <div className="join">
      <button className="join-item btn" onClick={dec}>
        «
      </button>
      <button className="join-item btn">{forms[pointer]}</button>
      <button className="join-item btn" onClick={inc}>
        »
      </button>
    </div>
  );
}
