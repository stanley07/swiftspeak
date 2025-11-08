const BASE =
  (typeof process !== 'undefined' ? (process as 
  any).env?.NEXT_PUBLIC_API_URL : undefined) ||
  (typeof process !== 'undefined' ? (process as any).env?.API_URL : 
  undefined) ||
  'http://localhost:8081';

export async function startSession(body: any) {
  const r = await fetch(`${BASE}/api/session/start`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function postAttempt(body: any) {
  const r = await fetch(`${BASE}/api/attempt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getNextReviews(lang: string, limit = 10) {
  const r = await fetch(`${BASE}/api/review/next?lang=${lang}&limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function postReviewGrade(body: any) {
  const r = await fetch(`${BASE}/api/review/grade`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
