"use client";

import React, { useState } from "react";
import { learnTopics, getTopicsByGroup } from "../../config/learn-config";

/**
 * Menampilkan konten satu section materi.
 * @param {{ heading: string, content: string }} props
 */
function Section({ heading, content }) {
  return (
    <div className="mb-7">
      <h3 className="mb-3 text-base font-semibold text-zinc-800 sm:text-lg">{heading}</h3>
      {content.split("\n\n").map((para, i) => (
        <p key={i} className="mb-3 text-sm leading-7 text-zinc-600 last:mb-0">
          {para}
        </p>
      ))}
    </div>
  );
}

/**
 * Panel materi utama.
 * @param {{ topic: typeof learnTopics[0] }} props
 */
function TopicContent({ topic }) {
  return (
    <article>
      <header className="mb-6 border-b border-zinc-100 pb-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-cyan-600">
          {topic.group}
        </p>
        <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">{topic.title}</h2>
      </header>
      <div>
        {topic.sections.map((section) => (
          <Section key={section.heading} heading={section.heading} content={section.content} />
        ))}
      </div>
    </article>
  );
}

/**
 * Halaman modul belajar kepabeanan dengan sidebar navigasi.
 */
export default function LearnPage() {
  const [activeId, setActiveId] = useState(learnTopics[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const topicsByGroup = getTopicsByGroup();
  const activeTopic = learnTopics.find((t) => t.id === activeId) ?? learnTopics[0];

  function handleSelect(id) {
    setActiveId(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="relative flex min-h-[70vh] gap-0">
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto border-r border-zinc-200 bg-white px-4 py-6 pt-20 transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:block lg:w-56 lg:shrink-0 lg:translate-x-0 lg:rounded-2xl lg:border lg:py-5 lg:pt-5 xl:w-64 ${
          sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        }`}
        aria-label="Navigasi topik materi"
      >
        <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Daftar Materi
        </p>
        <nav className="space-y-5">
          {Object.entries(topicsByGroup).map(([group, topics]) => (
            <div key={group}>
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {group}
              </p>
              <ul className="space-y-0.5">
                {topics.map((topic) => {
                  const isActive = topic.id === activeId;
                  return (
                    <li key={topic.id}>
                      <button
                        onClick={() => handleSelect(topic.id)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                          isActive
                            ? "bg-cyan-50 text-cyan-700"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {topic.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Konten utama */}
      <div className="min-w-0 flex-1 lg:pl-6">
        {/* Tombol buka sidebar — mobile only */}
        <div className="mb-5 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka daftar materi"
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
            Daftar Materi
          </button>
          <span className="text-sm text-zinc-500">{activeTopic.title}</span>
        </div>

        {/* Card konten */}
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-7 shadow-sm sm:px-8">
          <TopicContent topic={activeTopic} />
        </div>

        {/* Navigasi prev/next */}
        <div className="mt-5 flex items-center justify-between gap-3">
          {(() => {
            const idx = learnTopics.findIndex((t) => t.id === activeId);
            const prev = learnTopics[idx - 1];
            const next = learnTopics[idx + 1];
            return (
              <>
                <div className="flex-1">
                  {prev && (
                    <button
                      onClick={() => handleSelect(prev.id)}
                      className="group flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 shrink-0 transition group-hover:-translate-x-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="truncate">{prev.title}</span>
                    </button>
                  )}
                </div>
                <div className="flex-1 text-right">
                  {next && (
                    <button
                      onClick={() => handleSelect(next.id)}
                      className="group ml-auto flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
                    >
                      <span className="truncate">{next.title}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
