import type { Metadata } from "next";
import "./globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import { TooltipProvider } from "@/components/ui/tooltip";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "AI Video Studio — Professional Browser-Based Video Editor",
  description:
    "Edit videos with conversational AI, multi-track timelines, reference video matching, dynamic captions, and manual export. Privacy-first, session-based architecture.",
  keywords: ["video editor", "ai video editor", "ffmpeg", "webcodecs", "timeline editor", "captions", "reel editor"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="antialiased bg-studio-950 text-slate-900 dark:text-white min-h-screen">
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
