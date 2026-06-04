import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
