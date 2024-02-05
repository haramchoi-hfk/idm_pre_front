import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IDM 3D Audio",
  description: "IDM 3D Audio, AB DW HA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
