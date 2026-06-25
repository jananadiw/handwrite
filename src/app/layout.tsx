import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Libre_Baskerville, Work_Sans } from "next/font/google";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "handwrite",
  description: "Turn your beautiful hand writing into a font.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${libreBaskerville.variable} ${workSans.variable} bg-background font-sans text-ink antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
