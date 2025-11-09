import './globals.css';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast'; // Import Toaster here

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        {/* Toaster is now global! */}
        <Toaster position="top-center" />

        <div className="max-w-3xl mx-auto p-4">
          {/* New Header & Nav Bar */}
          <header className="flex items-center justify-between py-4 border-b border-gray-200 mb-6">
            <Link href="/" className="font-bold text-2xl text-blue-600">
              SwiftSpeak
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href="/start" className="text-gray-600 hover:text-gray-900">
                Sprint
              </Link>
              <Link href="/due" className="text-gray-600 hover:text-gray-900">
                Reviews
              </Link>
              {/* <span className="text-gray-300">|</span>
              <span className="text-sm opacity-70">Cloud Run • Gemini</span> */}
            </nav>
          </header>
          
          {/* Page content */}
          <main>{children}</main>
          
        </div>
      </body>
    </html>
  );
}