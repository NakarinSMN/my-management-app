// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth v4 - returns a function handler
const handler = NextAuth(authOptions);

// Export GET and POST handlers - NextAuth v4 returns a function
export { handler as GET, handler as POST };

