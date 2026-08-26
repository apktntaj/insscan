"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Toggle } from "@/components/ui/toggle";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const storedTheme = window.localStorage.getItem("pesisir-theme");

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return "dark";
}

function subscribeToTheme() {
  return () => undefined;
}

export default function ThemeToggle() {
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const storedTheme = useSyncExternalStore(subscribeToTheme, getInitialTheme, () => "dark");
  const theme = selectedTheme ?? storedTheme;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("pesisir-theme", theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <Toggle
      aria-label={isDark ? "Gunakan tema terang" : "Gunakan tema gelap"}
      pressed={isDark}
      onPressedChange={(pressed) => setSelectedTheme(pressed ? "dark" : "light")}
      variant="outline"
      size="sm"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span className="hidden sm:inline">{isDark ? "Terang" : "Gelap"}</span>
    </Toggle>
  );
}
