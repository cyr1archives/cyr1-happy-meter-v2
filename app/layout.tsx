import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

/* --------------------------------------------------
   Font Configuration
-------------------------------------------------- */

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "900"],
  variable: "--font-poppins",
  display: "swap",
});

/* --------------------------------------------------
   Metadata
-------------------------------------------------- */

export const metadata: Metadata = {
  title: "Happy Meter 2.0",
  description: "Internal team sentiment tracking",
  icons: {
    icon: "/favicon.svg",
  },
};

/* --------------------------------------------------
   Root Layout
-------------------------------------------------- */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${poppins.variable}
          font-sans
          antialiased
          min-h-screen
          bg-transparent
        `}
      >
        {children}
      </body>
    </html>
  );
}
