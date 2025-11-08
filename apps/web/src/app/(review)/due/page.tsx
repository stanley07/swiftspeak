'use client';
import { useEffect, useState } from 'react';
import { getNextReviews, postReviewGrade } from '@swiftspeak/sdk';

export default function Due(){
  const [lang,setLang]=useState<'en'|'yo'|'ig'|'ha'>('en');
  const [items,setItems]=useState<any[]>([]);

  useEffect(()=>{ (async()=> setItems((await getNextReviews(lang,10)).items))(); },[lang]);

  async function grade(id:string,g:number){
    const r=await postReviewGrade({ itemId:id, grade:g, latencyMs:1200 });
    alert(`Next due: ${new Date(r.nextDueAt).toLocaleString()}`);
    setItems(s=>s.filter(x=>x.id!==id));
  }

  return (
    <div className='space-y-3'>
      <select
        value={lang}
        onChange={e=>setLang(e.target.value as any)}
        className='border rounded px-2 py-1'
      >
        <option value='en'>English</option>
        <option value='yo'>Yorùbá</option>
        <option value='ig'>Ìgbò</option>
        <option value='ha'>Hausa</option>
      </select>

      {items.map(it=> (
        <div key={it.id} className='card'>
          <div className='text-xl'>{it.text_native}</div>
          <div className='opacity-70'>{it.gloss_en}</div>
          <div className='mt-2 flex gap-2'>
            {[0,1,2,3,4,5].map(g=> (
              <button
                key={g}
                className='border px-2 py-1 rounded'
                onClick={()=>grade(it.id,g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
