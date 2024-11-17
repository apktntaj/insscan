"use client";

import React, { useState } from "react";
import Pagination from "./Pagination";
import Title from "./Title";

export default function FormAddShipment({ actions, sheets }) {
  const [sheet, setSheet] = useState("Shipper");
  return (
    <div className="flex flex-col justify-between items-center min-h-[80%] shadow-md">
      <form action={actions}>
        <Title title={"Form sheet"} />
      </form>
      <Pagination items={sheets} />
    </div>
  );
}
