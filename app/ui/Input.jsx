"use client";

import React from "react";
import { arrayBuffer, convertBufferToJson } from "../utils/utility";

export default function Input({ handleChange }) {
  return (
    <input
      type='file'
      accept='.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      onChange={handleChange}
      className='file-input file-input-bordered w-full lg:max-w-xs max-w-sm'
    />
  );
}
