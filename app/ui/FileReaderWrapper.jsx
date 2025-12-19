"use client";

import React, { useState } from "react";

import { arrayBuffer, convertBufferToJson } from "../utils/utility";
import { isValidFormat, makeExcel } from "../utils/utility";

import Table from "./Table";
import Input from "./Input";
import Button from "./Button";

export default function ActionTableWrapper() {
  const [fileData, setFileData] = useState(null);
  const [status, setStatus] = useState("");

  const readExcelFile = (e) => {
    const path = e.target.files[0]?.name;
    const ext = path?.split(".").pop();

    if (ext !== "xls" && ext !== "xlsx") {
      alert("File yang kamu masukkan bukan file excel");
      e.target.value = "";
      return;
    }

    const bufferedFile = arrayBuffer(e.target.files[0]);
    bufferedFile.then((buffer) => {
      const jsonData = convertBufferToJson(buffer);
      setFileData(jsonData);
    });
  };

  const scrapeData = async () => {
    if (!fileData) {
      alert("File belum diinputkan");
      return;
    }

    setStatus("Loading...");

    const parsedHsCode = fileData
      .filter((row) => row.length !== 0)
      .map((row) => row.filter((cell) => isValidFormat(cell)))
      .reduce((arr1, arr2) => arr1.concat(arr2))
      .map((hs) => ({ hs_code: hs }));

    try {
      const response = await fetch(
        process.env.NODE_ENV === "production"
          ? "https://insscan-alamasyaries-projects.vercel.app/api"
          : "http://localhost:3000/api",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsedHsCode),
        }
      );

      const data = await response.json();
      makeExcel(data);
      setStatus("Get Data");
      setFileData(null);
    } catch (error) {
      console.error("Error", error);
    }
  };

  return (
    <div>
      <div className='container space-y-2 p-4 md:flex md:justify-between md:items-center'>
        <Input handleChange={readExcelFile} />
        <Button onClick={scrapeData}>Tarik Data</Button>
      </div>
      <Table fileData={fileData} />
    </div>
  );
}
