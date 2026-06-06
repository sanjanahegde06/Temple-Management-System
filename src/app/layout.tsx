import type { Metadata } from "next";
import { Cinzel, DM_Sans } from "next/font/google";
import "./globals.css";

const displayFont = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const bodyFont = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Temple Management System",
  description: "Digitize temple operations with a modern management suite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full bg-cream text-amber-950 antialiased">
        {children}
      </body>
    </html>
  );
}
