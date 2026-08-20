"use client";

import { useState } from "react";

export interface FaqItemData {
  q: string;
  a: string;
}

function FaqItem({
  item,
  open,
  onToggle,
}: {
  item: FaqItemData;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-zinc-100 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-zinc-800 sm:text-base">
          {item.q}
        </span>
        <span
          className={`mt-0.5 shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>
      {open ? (
        <p className="pb-5 text-sm leading-7 text-zinc-500">{item.a}</p>
      ) : null}
    </div>
  );
}

export default function FaqList({ items }: { items: FaqItemData[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return items.map((item, index) => (
    <FaqItem
      key={item.q}
      item={item}
      open={activeIndex === index}
      onToggle={() =>
        setActiveIndex((current) => (current === index ? null : index))
      }
    />
  ));
}
