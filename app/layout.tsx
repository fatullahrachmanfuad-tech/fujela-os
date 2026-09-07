import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FUJELA OS",
  description: "Intelligent Personal Life Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <div className="max-w-4xl mx-auto p-4 pt-8">
          {/* NAVIGASI GLOBAL (Hanya muncul satu kali di sini) */}
          <nav className="flex space-x-6 mb-8 border-b pb-4 overflow-x-auto">
            <Link href="/today" className="font-medium text-gray-500 hover:text-black whitespace-nowrap">Hari Ini</Link>
            <Link href="/dashboard" className="font-medium text-gray-500 hover:text-black whitespace-nowrap">Manajemen</Link>
            <Link href="/goals" className="font-medium text-gray-500 hover:text-black whitespace-nowrap">Goals</Link>
            <Link href="/health" className="font-medium text-gray-500 hover:text-black whitespace-nowrap">Health</Link>
            <Link href="/workout" className="font-medium text-gray-500 hover:text-black whitespace-nowrap">Workout</Link>
            <Link href="/finance" className="font-medium text-gray-500 hover:text-black whitespace-nowrap">Finance</Link>
            <Link href="/journal" className="font-medium text-gray-500 hover:text-black whitespace-nowrap">Journal</Link>
            <Link href="/analytics" className="font-medium text-gray-500 hover:text-black whitespace-nowrap">Analytics</Link>
            <Link href="/coach" className="font-medium text-gray-500 hover:text-black whitespace-nowrap">AI Coach</Link>
          </nav>
        </div>
        
        {/* KONTEN HALAMAN */}
        <main>{children}</main>
      </body>
    </html>
  );
}