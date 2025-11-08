'use client';

import { useEffect, useState, useCallback } from 'react';
import { postAttempt } from '@swiftspeak/sdk';

export default function Sprint() {
  const [items, setItems] = useState<any[]>([]);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');
  const [t, setT] = useState(90);
  const [sessionId, setSessionId] = useState('');
  const [ready, setReady] = useState(false);

  // Load session on mount
  useEffect(() => {
    const s = sessionStorage.getItem('items');
    setItems(s ? JSON.parse(s) : []);
    setSessionId(sessionStorage.getItem('sessionId') || '');
    setReady(true);
  }, []);

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => setT((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  // Go to next question
  const nextItem = useCallback(() => {
    setAnswer('');
    setI((x) => (items.length ? (x + 1) % items.length : 0));
  }, [items.length]);

  // Submit answer
  const onSubmit = useCallback(async () => {
    if (!items.length) return;
    const item = items[i];
    const res = await postAttempt({
      sessionId,
      itemId: item.id,
      mode: 'read',
      answerText: answer,
    });
    alert(`Score: ${Math.round(res.score * 100)}%`);
    nextItem();
  }, [answer, i, items, nextItem, sessionId]);

  if (!ready) return null;
  if (!items.length) return <div className="card">No items. Go 
back.</div>;

  const item = items[i];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">Sprint</h2>
        <div>Time: {t}s</div>
      </div>

      <div className="card">
        <div className="text-2xl">{item.text_native}</div>
        <div className="opacity-70">{item.gloss_en}</div>
      </div>

      <div className="card">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Say/type your answer"
          className="w-full border rounded px-2 py-2"
        />
        <div className="mt-2 flex gap-2">
          <button
            className="border px-3 py-2 rounded"
            onClick={onSubmit}
          >
            Submit
          </button>
          <button
            className="border px-3 py-2 rounded"
            onClick={nextItem}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

