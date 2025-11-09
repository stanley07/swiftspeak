'use client';
import { useEffect, useState } from 'react';
import { getNextReviews, postReviewGrade } from '@swiftspeak/sdk';
import { Toaster, toast } from 'react-hot-toast'; // We'll add this library next

// Define our descriptive grades
const gradeOptions = [
  { g: 1, label: 'Again', color: 'bg-red-500 hover:bg-red-600' },
  { g: 2, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600' },
  { g: 4, label: 'Good', color: 'bg-blue-500 hover:bg-blue-600' },
  { g: 5, label: 'Easy', color: 'bg-green-500 hover:bg-green-600' },
];

export default function Due() {
  const [lang, setLang] = useState<'en' | 'yo' | 'ig' | 'ha'>('en');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => setItems((await getNextReviews(lang, 10)).items))();
  }, [lang]);

  async function grade(id: string, g: number) {
    const r = await postReviewGrade({ itemId: id, grade: g, latencyMs: 1200 });
    
    // Replace alert with a toast notification
    const nextDueDate = new Date(r.nextDueAt).toLocaleDateString();
    toast.success(`Next review: ${nextDueDate}`);
    
    setItems((s) => s.filter((x) => x.id !== id));
  }

  return (
    <div className='space-y-4 max-w-2xl mx-auto'>
      {/* We need the Toaster for notifications to show up */}
      <Toaster position="top-center" />

      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as any)}
        // Added beautiful Tailwind styles to the <select>
        className='block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600'
      >
        <option value='en'>English</option>
        <option value='yo'>Yorùbá</option>
        <option value='ig'>Ìgbò</option>
        <option value='ha'>Hausa</option>
      </select>

      {items.map((it) => (
        <div
          key={it.id}
          // Used Tailwind classes to style the card
          className='bg-white shadow-md rounded-xl p-6'
        >
          {/* Styled the text */}
          <div className='text-3xl font-medium text-gray-900'>{it.text_native}</div>
          <div className='text-lg text-gray-500 mt-1'>{it.gloss_en}</div>
          
          {/* Replaced number buttons with our styled gradeOptions */}
          <div className='mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3'>
            {gradeOptions.map((opt) => (
              <button
                key={opt.g}
                // Applied Tailwind classes for beautiful, colored buttons
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