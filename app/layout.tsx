import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZenixMind — Your AI, all in one place",
  description: "A modern AI assistant that helps you think, create, research and get things done."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
