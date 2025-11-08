import './globals.css';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="min-h-screen bg-zinc-50 text-zinc-900">
    <div className="max-w-3xl mx-auto p-4">
      <header className="flex items-center justify-between py-3">
        <h1 className="font-bold text-xl">SwiftSpeak</h1>
        <nav className="text-sm opacity-70">Cloud Run • Gemini • GPU</nav>
      </header>{children}
    </div></body></html>);
}
