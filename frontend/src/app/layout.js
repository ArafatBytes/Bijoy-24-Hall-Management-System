import "./globals.css";
import { Inter } from "next/font/google";
import ThemeToggle from "../components/ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Bijoy 24 Hall Management System",
  description: "Digital hall management system for Bijoy 24 students",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="bijoy24" suppressHydrationWarning>
      <body className={`${inter.className} bg-base-100 text-base-content`}>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
