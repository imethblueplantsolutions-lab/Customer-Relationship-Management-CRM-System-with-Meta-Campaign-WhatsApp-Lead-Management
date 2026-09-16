import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MyCRM",
  description: "Customer Relationship Management System with WhatsApp Integration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 500,
            },
          }}
        />
      </body>
    </html>
  );
}

