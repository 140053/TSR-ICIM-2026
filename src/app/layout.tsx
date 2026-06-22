import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel, Nunito, DM_Sans } from "next/font/google";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import Starfield from "@/components/wrapper/starfield";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "TSR — Begin Your Quest",
  description: "Created in next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          ${cinzel.variable}
          ${nunito.variable}
          ${dmSans.variable}
          font-dm-sans antialiased
        `}
      >
        <Starfield />
       
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}