"use client";

import React, { useState } from "react";

import Table from "./Table";
import Input from "./Input";
import Button from "./Button";

export default function ActionTableWrapper() {
  const [fileData, setFileData] = useState(null);

  return (
    <div>
      <div className='container space-y-2 p-4 md:flex md:justify-between md:items-center'>
        <Input setFileData={setFileData} />
        <Button fileData={fileData} setDataTable={setFileData} />
      </div>
      <Table fileData={fileData} />
    </div>
  );
}
