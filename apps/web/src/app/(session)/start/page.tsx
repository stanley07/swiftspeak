'use client';
import { useState } from 'react';
// import { startSession } from '@swiftspeak/sdk'; // <-- We are no longer using this
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast'; // <-- IMPORT TOAST

// --- NEW: Add the fetch function directly in this file ---
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function startSession(body: any) {
  const r = await fetch(`${BASE}/api/session/start`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  // This block will now give us a detailed error
  if (!r.ok) {
    const errText = await r.text();
    console.error("API Error Response:", errText);
    toast.error(`API Error: ${r.statusText}. Check console for details.`);
    throw new Error(`API returned an error: ${r.statusText}`);
  }
  
  return r.json();
}
// --- END NEW FUNCTION ---

export default function Start() {
  const [lang, setLang] = useState<'en' | 'yo' | 'ig' | 'ha'>('en');
  const [level, setLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('A1');
  const [topic, setTopic] = useState('greetings');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onStart = async () => {
    setIsLoading(true);
    try {
      // This now calls our new local function
      const s = await startSession({ level, lang, topic }); 
      
      // This logic checks if the API returned 0 items
      if (!s.items || s.items.length === 0) {
        // This will now use the fallback logic from your API
        toast.error(`No items found for "${topic}". Starting a "greetings" session instead.`);
      }
      
      sessionStorage.setItem('sessionId', s.sessionId);
      sessionStorage.setItem('items', JSON.stringify(s.items));
      sessionStorage.setItem('lang', lang);
      router.push('/sprint');
    
    } catch (error) {
      console.error(error);
      toast.error(`Failed to start session. Is the API running?`);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded-xl p-6 space-y-6">
      <Toaster position="top-center" />
      <h2 className="text-xl font-semibold text-gray-900">Start a New Sprint</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="lang" className="block text-sm font-medium text-gray-700">
            Language
          </label>
          <select
            id="lang"
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
          >
            <option value="en">English</option>
            <option value="yo">Yorùbá</option>
            <option value="ig">Ìgbò</option>
            <option value="ha">Hausa</option>
          </select>
        </div>

        <div>
          <label htmlFor="level" className="block text-sm font-medium text-gray-700">
            Level
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value as any)}
            className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
          >
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
            Topic
          </label>
          <select
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
          >
            <option value="greetings">Greetings</option>
            <option value="travel">Travel</option>
            <option value="business">Business</option>
            <option value="health">Health</option>
            <option value="food">Food</option>
          </select>
        </div>
      </div>

      <button
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm ${
          isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-500'
        }`}
        onClick={onStart}
        disabled={isLoading}
      >
        {isLoading ? 'Starting...' : 'Start 60-sec Sprint'}
      </button>
    </div>
  );
}