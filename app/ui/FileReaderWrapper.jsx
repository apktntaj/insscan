"use client";

import React, { useState } from "react";

import Actions from "./Actions";
import Table from "./Table";
import { inswData } from "../utils/excel";
import { isValidFormat, makeExcel } from "../utils/utility";
import Stats from "./Stats";

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
      const response = await fetch("http://localhost:3000/cek-tarif/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedHsCode),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error", error);
    }

    console.log(parsedHsCode);
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
