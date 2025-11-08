import Link from 'next/link';
export default function Home(){
  return (<main className="space-y-6">
    <div className="card"><h2 className="font-semibold text-lg">Start a Speech Sprint</h2>
      <p className="text-sm opacity-80">Pick language and topic; practice in 90 seconds.</p>
      <div className="mt-3"><Link href="/start" className="inline-block border px-3 py-2 rounded">Start Session</Link></div></div>
    <div className="card"><h2 className="font-semibold text-lg">Reviews Due</h2>
      <p className="text-sm opacity-80">Spaced repetition keeps pronunciation sticky.</p>
      <div className="mt-3"><Link href="/due" className="inline-block border px-3 py-2 rounded">Open Reviews</Link></div></div>
  </main>);
}
