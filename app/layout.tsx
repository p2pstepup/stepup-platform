import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StepUp — P2P Mentoring Program",
  description: "Windsor SOM Step 1 Intensive Program",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap" rel="stylesheet"/>
      </head>
      <body>{children}</body>
    </html>
  )
}