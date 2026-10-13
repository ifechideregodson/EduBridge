import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduBridge — Your next exam starts here",
  description: "Prepare for JAMB UTME and WAEC with practice questions, timed CBT, learning plans and progress tracking.",
  applicationName: "EduBridge",
  keywords: ["JAMB CBT", "WAEC practice", "Nigeria education", "online learning"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
