export type LangCode = "en" | "yo" | "ig" | "ha";

export interface Item {
  id: string;
  lang: LangCode;
  type: "word" | "phrase";
  text_native: string;
  gloss_en: string;
}

export function updateSRS(ef: number, interval: number, grade: number, latencyMs: number){
  let newEf = ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (newEf < 1.3) newEf = 1.3;
  if (grade >= 3 && latencyMs > 3500) newEf -= 0.05;
  let newInterval = grade < 3 ? 1 : interval===0 ? 1 : interval===1 ? 3 : Math.round(interval*newEf);
  const due = new Date(); due.setDate(due.getDate()+newInterval);
  return { ef: Number(newEf.toFixed(2)), intervalDays: newInterval, dueAt: due.toISOString() };
}
