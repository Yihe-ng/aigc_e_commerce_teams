"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

type ThemeSwitcherProps = {
  className?: string;
};

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <Button
      isIconOnly
      variant="light"
      radius="full"
      aria-label="切换主题"
      onPress={toggleTheme}
      className={className}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-400" />
      ) : (
        <Moon className="h-5 w-5 text-slate-500" />
      )}
    </Button>
  );
}
