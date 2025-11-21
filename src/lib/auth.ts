// src/lib/auth.ts
// NextAuth Configuration

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// User interface
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        pin: { label: "PIN", type: "text" }
      },
      async authorize(credentials) {
        console.log("[AUTH DEBUG] Authorize called with PIN");
        
        if (!credentials?.pin) {
          console.log("[AUTH DEBUG] Missing PIN");
          return null;
        }

        // Validate PIN format (6 digits)
        const pinPattern = /^\d{6}$/;
        if (!pinPattern.test(credentials.pin)) {
          console.log("[AUTH DEBUG] Invalid PIN format");
          return null;
        }

        // กำหนด PIN ที่ถูกต้อง
        const correctPIN = "042323";
        
        // ตรวจสอบ PIN
        if (credentials.pin !== correctPIN) {
          console.log("[AUTH DEBUG] Invalid PIN");
          return null;
        }

        console.log("[AUTH DEBUG] PIN valid, creating session...");

        // Return user object (ไม่ต้องไปดึงจากฐานข้อมูล)
        const userObj = {
          id: "pin-user-001",
          username: "user",
          email: undefined,
          name: "ผู้ใช้",
          role: "user"
        };
        
        console.log("[AUTH DEBUG] Authorization successful, returning user:", { ...userObj });
        return userObj;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 3 * 60 * 60, // 3 ชั่วโมง
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false, // ไม่ต้องเช็ค NEXTAUTH_URL
      },
    },
  },
  // trustHost is handled via AUTH_TRUST_HOST environment variable in NextAuth v4
  // useSecureCookies is handled automatically based on NEXTAUTH_URL
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // ใช้ default redirect - ไม่ต้องเช็ค callback
  callbacks: {
    // ไม่ต้องใช้ redirect callback - ให้ NextAuth ใช้ default
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username || "";
        token.email = user.email || "";
        token.name = user.name || "";
        token.role = user.role || "user";
      }
      return token;
    },
    async session({ session, token }) {
      try {
        // Ensure session exists
        if (!session) {
          return {
            user: {
              id: "",
              username: "",
              email: undefined,
              name: "",
              role: "user"
            },
            expires: new Date().toISOString()
          };
        }

        // Ensure session.user exists
        if (!session.user) {
          session.user = {
            id: "",
            username: "",
            email: undefined,
            name: "",
            role: "user"
          };
        }

        // Map token data to session
        if (token) {
          session.user.id = (token.id as string) || "";
          session.user.username = (token.username as string) || "";
          session.user.email = (token.email as string) || undefined;
          session.user.name = (token.name as string) || "";
          session.user.role = (token.role as string) || "user";
        }

        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        // Return empty session if error
        return {
          user: {
            id: "",
            username: "",
            email: undefined,
            name: "",
            role: "user"
          },
          expires: new Date().toISOString()
        };
      }
    }
  },
  secret: "fallback-secret-key-for-development-only-change-in-production",
  debug: process.env.NODE_ENV === "development",
};


