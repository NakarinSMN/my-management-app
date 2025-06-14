// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Global styles, e.g., Tailwind CSS

import Layout from "./components/Layout"; // Import the main Layout component

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "ระบบจัดการงานบริการ ตรอ.บังรีท่าอิฐ",
  description: "Billing System",
  icons: {
    icon: "/packagemajor-svgrepo-com.svg", // Path to your favicon file
    // You can also add other icons like apple-touch-icon:
    // apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Logic to determine if it's the landing page
  // In a real application, you would typically use authentication status
  // or a more robust routing check here.
  const isLandingPage = typeof window !== 'undefined' && window.location.pathname === '/';

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* If it's the landing page, just render its content. */}
        {/* Otherwise, wrap the content with the main Layout component (which includes the sidebar). */}
        {isLandingPage ? (
          children
        ) : (
          <Layout>{children}</Layout>
        )}
      </body>
    </html>
  );
}