import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { GlobalTriggerProvider } from "@/components/tradepro/global-trigger-provider";
import { MarketDataProvider } from "@/components/tradepro/market-data-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradePro - Indian Market Paper Trading",
  description: "Practice trading Indian stock markets with virtual money. Trade NIFTY, BANKNIFTY, SENSEX options, futures & stocks risk-free.",
  keywords: ["TradePro", "Indian Stock Market", "Paper Trading", "NIFTY", "BANKNIFTY", "SENSEX", "Trading Simulator", "NSE", "Option Chain"],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        <GlobalTriggerProvider>
          <MarketDataProvider>
            {children}
          </MarketDataProvider>
        </GlobalTriggerProvider>
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
