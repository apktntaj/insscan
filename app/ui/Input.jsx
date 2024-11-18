"use client";

import React from "react";
import { arrayBuffer, convertBufferToJson } from "../utils/utility";

export default function Input({ setHsCodes }) {
  const handleChange = (e) => {
    const path = e.target.files[0].name;
    const ext = path.split(".").pop();

    if (ext !== "xls" && ext !== "xlsx") {
      alert("File yang kamu masukkan bukan file excel");
      return;
    }

    const bufferedFile = arrayBuffer(e.target.files[0]);
    bufferedFile.then((buffer) => {
      const jsonData = convertBufferToJson(buffer);
      setHsCodes(jsonData);
    });
  };

  return (
    <input
      type='file'
      // this is the same as accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      accept='.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      onChange={handleChange}
      className='file-input file-input-bordered w-full lg:max-w-xs max-w-sm'
    />
  );
}
