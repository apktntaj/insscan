import React, { useState } from "react";
import { isValidFormat, makeExcel } from "../utils/utility";

export default function Button({ fileData, setDataTable }) {
  const [status, setStatus] = useState("Get Data");

  const scrapeData = async () => {
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
      setDataTable(null);
    } catch (error) {
      console.error("Error", error);
    }
  };
  return (
    <button
      className={`btn btn-accent btn-outline w-full md:btn-wide tracking-wider text-slate-700`}
      disabled={fileData === null}
      onClick={scrapeData}
    >
      {status}
    </button>
  );
}
