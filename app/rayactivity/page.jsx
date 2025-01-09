"use client";

import React, { useState, useEffect } from "react";
import Title from "../ui/Title";

const title = "Raya Activity Page";
const descs = ["Still in development."];

export default function RayactivityPage() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space") {
        console.log(time);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [time]);

  return (
    <div className='container'>
      <Title title={title} descs={descs} />
      <div className='container flex justify-center h-screen mt-6'>
        <p className='text-9xl tracking-wider bg-gradient-to-r from-purple-400 via-emerald-500 to-sky-400 bg-clip-text text-transparent font-extrabold'>
          {time}
        </p>
      </div>
    </div>
  );
}
