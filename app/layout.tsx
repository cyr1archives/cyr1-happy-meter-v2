import type { Metadata } from "next";
import { Poppins } from "next/font/google"; // 1. Import Poppins
import "./globals.css";

// 2. Configure Poppins (Weights: Regular, SemiBold, Black)
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Happy Meter V2",
  description: "Internal team sentiment tracking",
  // 3. Link your new Favicon
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}