from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
import uvicorn
from rapidfuzz import fuzz
from pydantic import BaseModel
import nanoid
import os
import google.generativeai as genai
from typing import Literal

app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GEMINI SETUP ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not set. AI hints will be disabled.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

gemini_model = genai.GenerativeModel('gemini-1.5-flash')

async def get_ai_hint(correct_text, user_text, score):
    if not GEMINI_API_KEY:
        return "Check your spelling or pronunciation."
    if score > 0.95:
        return "Perfect!"
    try:
        prompt = f"""
        The user was trying to say this phrase: "{correct_text}"
        They actually said: "{user_text}"
        Their score was {int(score * 100)}/100.
        Please provide a very short, one-sentence hint to help them improve.
        Be encouraging. Address the user directly.
        Example: "You're very close! Just watch the vowel sound in 'hello'."
        """
        response = await gemini_model.generate_content_async(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini error: {e}")
        return "Keep practicing!"

# --- Load AI Model ---
device = "cuda:0" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if torch.cuda.is_available() else torch.float32
print(f"--- Loading model on {device} ---")
model_id = "distil-whisper/distil-large-v3"
model = AutoModelForSpeechSeq2Seq.from_pretrained(model_id, dtype=dtype, low_cpu_mem_usage=True, use_safetensors=True)
model.to(device)
processor = AutoProcessor.from_pretrained(model_id)
speech_pipeline = pipeline(
    "automatic-speech-recognition",
    model=model,
    tokenizer=processor.tokenizer,
    feature_extractor=processor.feature_extractor,
    max_new_tokens=128,
    dtype=dtype,
    device=device,
)

# --- NEW: MOCK DATABASE (LIST OF OBJECTS) ---
# We now add 'lang' and 'topic' to each item
mock_db = [
    # English
    {"id": "en_1", "lang": "en", "topic": "greetings", "text_native": "How are you today?", "gloss_en": "Greeting"},
    {"id": "en_2", "lang": "en", "topic": "greetings", "text_native": "Nice to meet you", "gloss_en": "Polite phrase"},
    {"id": "en_3", "lang": "en", "topic": "travel", "text_native": "Where is the airport?", "gloss_en": "Question"},
    {"id": "en_4", "lang": "en", "topic": "food", "text_native": "I would like to order water", "gloss_en": "Request"},
    {"id": "en_5", "lang": "en", "topic": "business", "text_native": "What time is the meeting?", "gloss_en": "Question"},
    {"id": "en_6", "lang": "en", "topic": "health", "text_native": "I need to see a doctor", "gloss_en": "Statement"},

    # Yorùbá
    {"id": "yo_1", "lang": "yo", "topic": "greetings", "text_native": "Ẹ káàrọ̀", "gloss_en": "Good morning"},
    {"id": "yo_2", "lang": "yo", "topic": "greetings", "text_native": "Báwo ni?", "gloss_en": "How are you?"},
    {"id": "yo_3", "lang": "yo", "topic": "food", "text_native": "Mo fẹ́ jẹun", "gloss_en": "I want to eat"},

    # Ìgbò
    {"id": "ig_1", "lang": "ig", "topic": "greetings", "text_native": "Ụtụtụ ọma", "gloss_en": "Good morning"},
    {"id": "ig_2", "lang": "ig", "topic": "greetings", "text_native": "Kedu?", "gloss_en": "How are you?"},
    {"id": "ig_3", "lang": "ig", "topic": "food", "text_native": "Biko nye m mmiri", "gloss_en": "Please give me water"},

    # Hausa
    {"id": "ha_1", "lang": "ha", "topic": "greetings", "text_native": "Ina kwana", "gloss_en": "Good morning"},
    {"id": "ha_2", "lang": "ha", "topic": "greetings", "text_native": "Yaya kake?", "gloss_en": "How are you?"},
    {"id": "ha_3", "lang": "ha", "topic": "travel", "text_native": "Ina tashar jirgi?", "gloss_en": "Where is the airport?"},
]

# --- Helper function to find text ---
def get_correct_text(itemId: str):
    for item in mock_db:
        if item["id"] == itemId:
            return item["text_native"].lower().strip()
    return ""


# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"status": "GPU API is running"}

# NEW: Pydantic model for the session start request
class StartSessionRequest(BaseModel):
    lang: Literal["en", "yo", "ig", "ha"] = "en"
    topic: str = "greetings"
    level: str = "A1" # We're not using level yet, but it's good to have

# NEW: UPDATED SESSION START ENDPOINT
@app.post("/api/session/start")
def start_session(request: StartSessionRequest):
    print(f"Starting session for lang={request.lang}, topic={request.topic}")
    
    # Filter the DB based on lang and topic
    items_to_send = [
        item for item in mock_db 
        if item["lang"] == request.lang and item["topic"] == request.topic
    ]
    
    # If no items match, fall back to just language
    if not items_to_send:
        items_to_send = [item for item in mock_db if item["lang"] == request.lang]
            
    return {
        "sessionId": f"sess_{nanoid.generate()}",
        "items": items_to_send[:10] # Send up to 10 items
    }

# Pydantic model for the text attempt
class TextAttempt(BaseModel):
    itemId: str
    answerText: str

# NEW: UPDATED TEXT ATTEMPT ENDPOINT
@app.post("/api/attempt/text")
async def handle_text_attempt(attempt: TextAttempt):
    print(f"Received text attempt for item: {attempt.itemId}")
    
    # Use helper function to find the text
    correct_text = get_correct_text(attempt.itemId)
    if not correct_text:
        return {"error": "Item not found", "score": 0}

    user_text = attempt.answerText.lower().strip()
    print(f"Correct text: {correct_text}")
    print(f"User text: {user_text}")

    score = fuzz.ratio(correct_text, user_text) / 100
    hint = await get_ai_hint(correct_text, user_text, score)

    return {
        "id": f"attempt_{nanoid.generate()}",
        "score": score,
        "hint": hint,
        "transcription": user_text
    }

# NEW: UPDATED AUDIO ATTEMPT ENDPOINT
@app.post("/api/attempt")
async def handle_attempt(
    audio_file: UploadFile = File(...), 
    itemId: str = Form(...)
):
    print(f"Received attempt for item: {itemId}")
    
    # Use helper function to find the text
    correct_text = get_correct_text(itemId)
    if not correct_text:
        return {"error": "Item not found", "score": 0}

    audio_bytes = await audio_file.read()
    transcription_result = speech_pipeline(audio_bytes)
    user_text = transcription_result["text"].lower().strip()
    print(f"Correct text: {correct_text}")
    print(f"User text: {user_text}")

    score = fuzz.ratio(correct_text, user_text) / 100
    hint = await get_ai_hint(correct_text, user_text, score)

    return {
        "id": f"attempt_{itemId}",
        "score": score,
        "hint": hint,
        "transcription": user_text
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)