import { Providers } from "./providers";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flippy Memory | Fun Card Matching Memory Game",
  description:
    "Challenge your memory with Flippy Memory - a fun and engaging card matching game. Play with different themes, compete for high scores, and enjoy daily challenges. Perfect for all ages!",
  keywords: "memory game, card matching game, brain training, educational game, puzzle game, flippy memory",
  icons: {
    icon: [{ url: "../public/favicon.ico", sizes: "any" }],
  },
  openGraph: {
    title: "Flippy Memory | Fun Card Matching Memory Game",
    description: "Challenge your memory with Flippy Memory - a fun and engaging card matching game. Perfect for all ages!",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
