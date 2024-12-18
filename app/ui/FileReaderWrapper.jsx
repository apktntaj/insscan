"use client";

import React, { useState } from "react";

import Actions from "./Actions";
import Table from "./Table";
import { isValidFormat, makeExcel } from "../utils/utility";

export default function ActionTableWrapper() {
  const [hsCodes, setHsCodes] = useState(null);
  const [status, setStatus] = useState("Disabled");

  let parsedHsCode = [];
  const handleClick = async () => {
    parsedHsCode = hsCodes
      .filter((row) => row.length !== 0)
      .map((row) => row.filter((cell) => isValidFormat(cell)))
      .reduce((arr1, arr2) => arr1.concat(arr2))
      .map((hs) => ({ hs_code: hs }));

    // fetch parsedHsCode to localhost:3000/cek-tarif
    try {
      setStatus("Loading...");
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
      setHsCodes(null);
      setStatus("Disabled");
    } catch (error) {
      console.error("Error", error);
    }
  };

  return (
    <div>
      <Actions
        onChangeFile={setHsCodes}
        buttonChildren={status}
        onButtonClick={handleClick}
      />
      <Table data={hsCodes} setButtonStatus={setStatus} />
    </div>
  );
}
