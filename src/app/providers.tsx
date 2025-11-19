// src/app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "./contexts/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  );
}

