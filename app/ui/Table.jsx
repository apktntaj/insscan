"use client";

import React from "react";

import Alert from "./Alert";
import Row from "./Row";
import { isValidFormat } from "../utils/utility";

export default function Table({ data, setButtonStatus }) {
  if (!data) return <Alert message='Belum ada data' />;

  setButtonStatus("Cari Data Pajak Di INTR");

  const rows = data
    .filter((row) => row.length !== 0)
    .map((row) => row.filter((cell) => isValidFormat(cell)))
    .reduce((arr1, arr2) => arr1.concat(arr2))
    .map((row, idx) => (
      <tr className='hover' key={idx}>
        <td>{idx + 1}</td>
        <Row rowCells={row} />
      </tr>
    ));

  return (
    <div className='overflow-x-auto max-h-80'>
      <table className='table'>
        <thead></thead>
        <tbody>
          {rows.length === 0 ? (
            <Alert message='Opps Tidak ada data HS Code yang ditemukan' />
          ) : (
            rows
          )}
        </tbody>
      </table>
    </div>
  );
}

function noHolesEl(arr) {
  return Array.from(arr, (el) => (el !== undefined ? el : null));
}

function hsList(arr) {
  const res = [];
  const cleanedData = arr.filter((val) => val !== undefined);

  return arr.filter((val) => isValidFormat(val));
}

function cleanedArr(arr) {
  return arr.filter((el) => el !== undefined);
}
