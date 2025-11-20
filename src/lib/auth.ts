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
        console.log("[AUTH DEBUG] Authorize called with username:", credentials?.username);
        
        if (!credentials?.username || !credentials?.password) {
          console.log("[AUTH DEBUG] Missing credentials");
          return null;
        }

        try {
          const db = await getDatabase();
          const users = db.collection("users");
          
          // ค้นหาผู้ใช้ด้วย username หรือ email
          console.log("[AUTH DEBUG] Searching for user...");
          const user = await users.findOne({
            $or: [
              { username: credentials.username },
              { email: credentials.username }
            ]
          });

          if (!user) {
            console.log("[AUTH DEBUG] User not found");
            return null;
          }

          console.log("[AUTH DEBUG] User found, checking password...");
          // ตรวจสอบรหัสผ่าน
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log("[AUTH DEBUG] Invalid password");
            return null;
          }

          console.log("[AUTH DEBUG] Password valid, updating lastLogin...");
          // อัปเดต lastLogin
          await users.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
          );

          // Return user object
          const userObj = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            name: user.name || user.username,
            role: user.role || "user"
          };
          console.log("[AUTH DEBUG] Authorization successful, returning user:", { ...userObj, password: "***" });
          return userObj;
        } catch (error) {
          console.error("[AUTH DEBUG] Auth error:", error);
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
        secure: process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https://"),
        // Don't set domain - let browser handle it automatically
        // This ensures cookies work on Netlify subdomains
      },
    },
  },
  // trustHost is handled via AUTH_TRUST_HOST environment variable in NextAuth v4
  // useSecureCookies is handled automatically based on NEXTAUTH_URL
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("[AUTH DEBUG] Redirect callback called:", { url, baseUrl, urlType: typeof url, baseUrlType: typeof baseUrl });
      
      // Always return relative path to avoid URL construction issues
      // Handle empty or invalid url
      if (!url || typeof url !== 'string' || url.trim() === '') {
        console.log("[AUTH DEBUG] Empty or invalid URL, defaulting to /dashboard");
        return "/dashboard";
      }
      
      // Prevent redirect to login page
      if (url.includes("/login") || url.includes("/register")) {
        console.log("[AUTH DEBUG] URL contains login/register, redirecting to /dashboard");
        return "/dashboard";
      }

      // If url is relative, return it as is (safest option)
      if (url.startsWith("/")) {
        console.log("[AUTH DEBUG] Relative URL, returning:", url);
        return url;
      }
      
      // If url is absolute, try to extract pathname without constructing URL object
      // This avoids the "Failed to construct URL" error
      try {
        // Try to extract pathname manually from string
        const match = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
        if (match && match[1]) {
          const pathname = match[1];
          console.log("[AUTH DEBUG] Extracted pathname from absolute URL:", pathname);
          // Validate the pathname
          if (pathname.startsWith("/") && !pathname.includes("/login") && !pathname.includes("/register")) {
            return pathname;
          }
        }
      } catch (error) {
        console.error("[AUTH DEBUG] Error extracting pathname:", error);
      }
      
      // Default to dashboard (always return relative path)
      console.log("[AUTH DEBUG] Default redirect to /dashboard");
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


