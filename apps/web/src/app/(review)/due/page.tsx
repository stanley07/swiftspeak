'use client';
import { useEffect, useState, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { getUserId } from '../../userId';

// --- NEW API FUNCTIONS ---
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function getNextReviews(lang: string, limit = 10) {
  const userId = getUserId();
  const r = await fetch(`${BASE}/api/review/next?userId=${userId}&lang=${lang}&limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function postReviewGrade(itemId: string, grade: number) {
  const r = await fetch(`${BASE}/api/review/grade`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ itemId, grade, userId: getUserId() }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
// --- END API FUNCTIONS ---

// Define our descriptive grades
const gradeOptions = [
  { g: 1, label: 'Again', color: 'bg-red-500 hover:bg-red-600' },
  { g: 3, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600' },
  { g: 4, label: 'Good', color: 'bg-blue-500 hover:bg-blue-600' },
  { g: 5, label: 'Easy', color: 'bg-green-500 hover:bg-green-600' },
];

export default function Due(){
  const [lang,setLang]=useState<'en'|'yo'|'ig'|'ha'>('en');
  const [items,setItems]=useState<any[]>([]);

  // Function to load reviews
  const loadReviews = useCallback(async () => {
    try {
      const data = await getNextReviews(lang, 10);
      setItems(data.items || []);
    } catch (e) {
      toast.error("Failed to load reviews.");
    }
  }, [lang]);

  // Load reviews on mount and when lang changes
  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function grade(id:string, g:number){
    try {
      const r = await postReviewGrade(id, g);
      const nextDueDate = new Date(r.nextDueAt).toLocaleDateString();
      toast.success(`Next review: ${nextDueDate}`);
      // Remove item from the list
      setItems(s => s.filter(x => x.id !== id));
    } catch (e) {
      toast.error("Failed to save grade.");
    }
  }

  return (
    <div className='space-y-4 max-w-2xl mx-auto'>
      <Toaster position="top-center" />
      <select
        value={lang}
        onChange={e=>setLang(e.target.value as any)}
        className='block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600'
      >
        <option value='en'>English</option>
        <option value='yo'>Yorùbá</option>
        <option value='ig'>Ìgbò</option>
        <option value='ha'>Hausa</option>
      </select>

      {items.length === 0 && (
        <div className="bg-white shadow-md rounded-xl p-6 text-center text-gray-600">
          No reviews due for this language. Go do some sprints!
        </div>
      )}

      {items.map(it=> (
        <div 
          key={it.id} 
          className='bg-white shadow-md rounded-xl p-6'
        >
          <div className='text-3xl font-medium text-gray-900'>{it.text_native}</div>
          <div className='text-lg text-gray-500 mt-1'>{it.gloss_en}</div>
          
          <div className='mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3'>
            {gradeOptions.map((opt) => (
              <button
                key={opt.g}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all ${opt.color}`}
                onClick={() => grade(it.id, opt.g)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}