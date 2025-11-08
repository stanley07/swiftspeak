'use client';
import { useState } from 'react';
import { startSession } from '@swiftspeak/sdk';
import { useRouter } from 'next/navigation';
export default function Start(){
  const [lang,setLang]=useState<'en'|'yo'|'ig'|'ha'>('en');
  const [level,setLevel]=useState<'A1'|'A2'|'B1'|'B2'|'C1'|'C2'>('A1');
  const [topic,setTopic]=useState('greetings');
  const router=useRouter();
  return (<div className="card space-y-3">
    <div className="grid grid-cols-3 gap-3 text-sm">
      <label>Language<select value={lang} onChange={e=>setLang(e.target.value as any)} className="w-full border rounded px-2 py-1"><option value="en">English</option><option value="yo">Yorùbá</option><option value="ig">Ìgbò</option><option value="ha">Hausa</option></select></label>
      <label>Level<select value={level} onChange={e=>setLevel(e.target.value as any)} className="w-full border rounded px-2 py-1">{['A1','A2','B1','B2','C1','C2'].map(l=> <option key={l} value={l}>{l}</option>)}</select></label>
      <label>Topic<input value={topic} onChange={e=>setTopic(e.target.value)} className="w-full border rounded px-2 py-1"/></label>
    </div>
    <button className="border px-3 py-2 rounded" onClick={async()=>{
      const s=await startSession({level,lang,topic});
      sessionStorage.setItem('sessionId', s.sessionId);
      sessionStorage.setItem('items', JSON.stringify(s.items));
      sessionStorage.setItem('lang', lang);
      router.push('/sprint');
    }}>Start 90-sec Sprint</button></div>);
}
