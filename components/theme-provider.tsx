"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const forcedTheme = process.env.NEXT_PUBLIC_DEFAULT_THEME || "dark";

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={forcedTheme}
      forcedTheme={forcedTheme}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
