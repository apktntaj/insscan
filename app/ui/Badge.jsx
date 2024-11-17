import React from "react";

export default function Badge({ variant, children }) {
  return (
    <div className={`badge badge-${variant ? variant : "ghost"}`}>
      {children}
    </div>
  );
}
