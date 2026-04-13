import type { Metadata } from "next";
import localFont from "next/font/local";
import "@pinpoint/shad-ui/globals.css";
import Providers from "./_components/providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

// TODO develop this more
export const metadata: Metadata = {
  title: "PinPoint",
  description: "The moment, mapped.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Providers>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
      </Providers>
    </html>
  );
}
