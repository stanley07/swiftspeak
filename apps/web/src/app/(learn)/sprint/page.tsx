'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';

// --- API SDK FUNCTIONS ---
const BASE = process.env.NEXT_PUBLIC_GPU_API_URL || 'http://localhost:8080';

async function postAttemptWithAudio(itemId: string, audioBlob: Blob) {
  const formData = new FormData();
  formData.append('audio_file', audioBlob, 'attempt.audio');
  formData.append('itemId', itemId);
  const r = await fetch(`${BASE}/api/attempt`, { method: 'POST', body: formData });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function postAttemptWithText(itemId: string, answerText: string) {
  const r = await fetch(`${BASE}/api/attempt/text`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ itemId, answerText }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
// --- END API SDK FUNCTIONS ---


export default function Sprint() {
  const [items, setItems] = useState<any[]>([]);
  const [i, setI] = useState(0);
  const [t, setT] = useState(90);
  const [ready, setReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [mode, setMode] = useState<'audio' | 'text'>('audio');
  const [textAnswer, setTextAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [audioMimeType, setAudioMimeType] = useState('');

  useEffect(() => {
    const s = sessionStorage.getItem('items');
    setItems(s ? JSON.parse(s) : []);
    setReady(true);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setT((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.onstart = () => {
        setAudioMimeType(mediaRecorderRef.current!.mimeType);
      };
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: audioMimeType });
        setAudioBlob(blob);
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioBlob(null);
    } else {
      toast.error('Audio recording is not supported in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const nextItem = useCallback(() => {
    setAudioBlob(null);
    setTextAnswer('');
    setLastResult(null); 
    setI((x) => (items.length ? (x + 1) % items.length : 0));
  }, [items.length]);

  const onSubmit = useCallback(async () => {
    const item = items[i];
    if (mode === 'audio' && !audioBlob) {
      toast.error("Please record your audio first!");
      return;
    }
    if (mode === 'text' && !textAnswer.trim()) {
      toast.error("Please type your answer first!");
      return;
    }
    
    setIsLoading(true);
    
    try {
      let res;
      if (mode === 'audio') {
        res = await postAttemptWithAudio(item.id, audioBlob!);
      } else {
        res = await postAttemptWithText(item.id, textAnswer);
      }
      setLastResult(res); 

    } catch (error) {
      console.error(error);
      toast.error("Failed to submit attempt.");
    } finally {
      setIsLoading(false);
    }
  }, [i, items, audioBlob, textAnswer, mode]); 

  if (!ready) return null;
  if (!items.length) return <div className="bg-white shadow-md rounded-xl p-6">No items. Go back.</div>;

  const item = items[i];

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Toaster position="top-center" />
      <div className="flex justify-between items-center py-2">
        <h2 className="text-xl font-semibold">Sprint</h2>
        <div className="text-lg font-medium text-gray-700">
          Time: <span className="font-bold text-blue-600">{t}s</span>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-xl p-6 text-center">
        <div className="text-4xl font-medium text-gray-900">{item.text_native}</div>
        <div className="text-xl text-gray-500 mt-2">{item.gloss_en}</div>
      </div>

      <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
        
        {isLoading && (
          <div className="text-center text-gray-600">Scoring...</div>
        )}

        {!isLoading && lastResult && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500">Your Score</div>
              <div className="text-6xl font-bold text-blue-600">
                {Math.round(lastResult.score * 100)}%
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-500">Your answer:</div>
              <div className="text-gray-800 italic">{lastResult.transcription}</div>
            </div>
            
            {/* --- THIS IS THE NEW BLOCK TO SHOW THE HINT --- */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm font-medium text-blue-700">Gemini's Hint:</div>
              <div className="text-blue-900">{lastResult.hint}</div>
            </div>
            {/* --- END NEW BLOCK --- */}

            <button
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              onClick={nextItem}
            >
              Next
            </button>
          </div>
        )}

        {!isLoading && !lastResult && (
          <>
            <div className="flex justify-center border border-gray-200 rounded-lg p-1">
              <button
                className={`flex-1 rounded-md px-3 py-1 text-sm font-medium ${
                  mode === 'audio' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setMode('audio')}
              >
                Audio
              </button>
              <button
                className={`flex-1 rounded-md px-3 py-1 text-sm font-medium ${
                  mode === 'text' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setMode('text')}
              >
                Text
              </button>
            </div>

            {mode === 'audio' && (
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-600">
                  {isRecording ? "Recording..." : (audioBlob ? "Ready to submit!" : "Click record to speak")}
                </div>
                {audioBlob && (
                  <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
                )}
                <div className="mt-2 flex gap-3">
                  {!isRecording ? (
                    <button
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                      onClick={startRecording}
                    >
                      Record
                    </button>
                  ) : (
                    <button
                      className="flex-1 rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                      onClick={stopRecording}
                    >
                      Stop
                    </button>
                  )}
                  <button
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm ${
                      !audioBlob ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                    onClick={onSubmit}
                    disabled={!audioBlob}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}

            {mode === 'text' && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                />
                <button
                  className={`w-full rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm ${
                    !textAnswer.trim() ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                  onClick={onSubmit}
                  disabled={!textAnswer.trim()}
                >
                  Submit
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}