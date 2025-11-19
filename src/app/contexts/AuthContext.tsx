// src/app/contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUser({
        id: session.user.id || "",
        username: session.user.username || "",
        email: session.user.email || undefined,
        name: session.user.name || "",
        role: session.user.role || "user"
      });
    } else if (status === "unauthenticated") {
      setUser(null);
    }
  }, [session, status]);

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: "/login" });
    setUser(null);
  };

  const refresh = async () => {
    // NextAuth จะ refresh session อัตโนมัติ
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated",
        signOut,
        refresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

