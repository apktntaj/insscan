"use client";

import React, { useState, useEffect } from "react";
import { Title } from "../presentation/components";

const PAGE_TITLE = "Raya Activity Page";
const PAGE_DESCRIPTION = ["Still in development."];

/**
 * Rayactivity Page
 * @description Development/test page with live clock
 */
export default function RayactivityPage() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container mx-auto px-4">
      <Title title={PAGE_TITLE} descs={PAGE_DESCRIPTION} />
      <div className="flex justify-center h-screen mt-6">
        <p className="text-9xl tracking-wider bg-gradient-to-r from-purple-400 via-emerald-500 to-sky-400 bg-clip-text text-transparent font-extrabold">
          {time}
        </p>
      </div>
    </div>
  );
}
