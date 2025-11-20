// src/lib/auth.ts
// NextAuth Configuration

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getDatabase } from "./mongodb";
import bcrypt from "bcryptjs";

// User interface
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}

// Normalize URL helper - ensure protocol is present
const normalizeUrl = (value?: string | null): string => {
  if (!value) return "";
  const trimmed = value.trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

// Ensure process.env.NEXTAUTH_URL always has protocol (runtime + build)
const normalizedNextAuthUrl = normalizeUrl(process.env.NEXTAUTH_URL);
if (normalizedNextAuthUrl) {
  process.env.NEXTAUTH_URL = normalizedNextAuthUrl;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const db = await getDatabase();
          const users = db.collection("users");
          
          // ค้นหาผู้ใช้ด้วย username หรือ email
          const user = await users.findOne({
            $or: [
              { username: credentials.username },
              { email: credentials.username }
            ]
          });

          if (!user) {
            return null;
          }

          // ตรวจสอบรหัสผ่าน
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // อัปเดต lastLogin
          await users.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
          );

          // Return user object
          return {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            name: user.name || user.username,
            role: user.role || "user"
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 วัน
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Prevent redirect to login page
      if (url.includes("/login") || url.includes("/register")) {
        return "/dashboard";
      }

      // If url is relative, return it as is
      if (url.startsWith("/")) {
        return url;
      }
      
      // If url is absolute, check if same origin
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) {
          // Same origin - return relative path
          return urlObj.pathname + urlObj.search;
        }
      } catch {
        // Invalid URL, use default
      }
      
      // Default to dashboard
      return "/dashboard";
    },
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
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development-only-change-in-production",
  debug: process.env.NODE_ENV === "development",
};


