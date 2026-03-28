import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AstroSync — Space Health Monitor",
  description:
    "Real-time physiological monitoring dashboard for extreme environments. DSP-powered heart rate analysis and Space Readiness scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
