import type { Metadata, Viewport } from "next";
import "./globals.css";
import ScreenshotGuard from "@/components/ScreenshotGuard";

export const metadata: Metadata = {
  title: "GVCC Learning Portal",
  description: "Watch learning videos, bookmark key moments, and pick up right where you left off.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ScreenshotGuard />
        {children}
      </body>
    </html>
  );
}
