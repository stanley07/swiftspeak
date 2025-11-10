from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
import uvicorn
from rapidfuzz import fuzz
from pydantic import BaseModel
import nanoid
import os
from typing import Literal
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# --- Load Environment Variables ---
load_dotenv() # This loads your .env file

# --- Imports for GCP ---
from google.cloud import firestore
from google.cloud import aiplatform
from google.cloud import texttospeech
from google.cloud import storage
import vertexai
from vertexai.generative_models import GenerativeModel, Part
from google.cloud.firestore_v1.base_query import FieldFilter


app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FIRESTORE SETUP ---
db = firestore.Client()

# --- TTS and Storage Clients ---
tts_client = texttospeech.TextToSpeechClient()
storage_client = storage.Client()
AUDIO_BUCKET_NAME = "swifttalk" # <--- Make sure this is your bucket name

# --- VERTEX AI (GEMINI) SETUP ---
GCP_PROJECT_ID = os.environ.get("GCP_PROJECT_ID")
if not GCP_PROJECT_ID:
    print("WARNING: GCP_PROJECT_ID not set. AI hints will be disabled.")
else:
    try:
        # --- THIS IS THE FIX ---
        # Initializing in the correct GPU region per hackathon rules
        aiplatform.init(project=GCP_PROJECT_ID, location="europe-west1")
        gemini_model = GenerativeModel("gemini-pro") # Using gemini-pro for stability
        print("--- Vertex AI Gemini model 'gemini-pro' loaded in europe-west1 ---")
    except Exception as e:
        print(f"!!! FAILED to load Gemini: {e}")
        print("!!! AI hints will be disabled.")
        GCP_PROJECT_ID = None # Disable hints if init fails

async def get_ai_hint(correct_text, user_text, score):
    if not GCP_PROJECT_ID: return "Check your spelling or pronunciation."
    if score > 0.95: return "Perfect!"
    try:
        prompt = f"""
        The user was trying to say this phrase: "{correct_text}"
        They actually said: "{user_text}"
        Their score was {int(score * 100)}/100.
        Please provide a very short, one-sentence hint. Be encouraging.
        """
        response = await gemini_model.generate_content_async(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini error: {e}")
        return "Keep practicing!"

# --- Load Speech-to-Text Model ---
device = "cuda:0" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if torch.cuda.is_available() else torch.float32
print(f"--- Loading model on {device} ---")

# --- THIS IS YOUR NEW LOGIC ---
# Get Model Directory from Environment Variable
MODEL_DIR = os.environ.get("MODEL_DIR")
use_local_files = False
model_id = "distil-whisper/distil-large-v3" # Default to Hugging Face

if MODEL_DIR:
    # If MODEL_DIR is set (e.g., "/app/model" in production)
    # Load from that local path
    model_id = MODEL_DIR
    use_local_files = True
    print(f"Loading model from local path: {model_id}")
else:
    # If not set (e.g., local dev without .env)
    # Download from Hugging Face
    print(f"WARNING: MODEL_DIR not set. Downloading model {model_id} from Hugging Face.")
    print("This will be slow. For faster local dev, run download_model.py and set MODEL_DIR=./model in your .env file")
# --- END NEW LOGIC ---

model = AutoModelForSpeechSeq2Seq.from_pretrained(
    model_id, 
    dtype=dtype, 
    low_cpu_mem_usage=True, 
    use_safetensors=True, 
    local_files_only=use_local_files
)
model.to(device)
processor = AutoProcessor.from_pretrained(
    model_id, 
    local_files_only=use_local_files
)

# --- (The rest of your main.py file is unchanged) ---

# --- MOCK PHRASE LIST (for seeding) ---
mock_db_phrases = [
    {"id": "en_1", "lang": "en", "topic": "greetings", "text_native": "How are you today?", "gloss_en": "Greeting", "voice": "en-US-Standard-F"},
    {"id": "en_2", "lang": "en", "topic": "greetings", "text_native": "Nice to meet you", "gloss_en": "Polite phrase", "voice": "en-US-Standard-F"},
    {"id": "en_7", "lang": "en", "topic": "greetings", "text_native": "What's your name?", "gloss_en": "Question", "voice": "en-US-Standard-F"},
    {"id": "en_3", "lang": "en", "topic": "travel", "text_native": "Where is the airport?", "gloss_en": "Question", "voice": "en-US-Standard-F"},
    {"id": "en_8", "lang": "en", "topic": "travel", "text_native": "I need a taxi", "gloss_en": "Request", "voice": "en-US-Standard-F"},
    {"id": "en_9", "lang": "en", "topic": "travel", "text_native": "Does this bus go to the city center?", "gloss_en": "Question", "voice": "en-US-Standard-F"},
    {"id": "en_4", "lang": "en", "topic": "food", "text_native": "I would like to order water", "gloss_en": "Request", "voice": "en-US-Standard-F"},
    {"id": "en_10", "lang": "en", "topic": "food", "text_native": "Can I see the menu, please?", "gloss_en": "Request", "voice": "en-US-Standard-F"},
    {"id": "en_11", "lang": "en", "topic": "food", "text_native": "The check, please", "gloss_en": "Request", "voice": "en-US-Standard-F"},
    {"id": "en_5", "lang": "en", "topic": "business", "text_native": "What time is the meeting?", "gloss_en": "Question", "voice": "en-US-Standard-F"},
    {"id": "en_12", "lang": "en", "topic": "business", "text_native": "Here is my business card", "gloss_en": "Statement", "voice": "en-US-Standard-F"},
    {"id": "en_13", "lang": "en", "topic": "business", "text_native": "Let's schedule a follow-up call", "gloss_en": "Suggestion", "voice": "en-US-Standard-F"},
    {"id": "en_6", "lang": "en", "topic": "health", "text_native": "I need to see a doctor", "gloss_en": "Statement", "voice": "en-US-Standard-F"},
    {"id": "en_14", "lang": "en", "topic": "health", "text_native": "Where is the nearest pharmacy?", "gloss_en": "Question", "voice": "en-US-Standard-F"},
    {"id": "en_15", "lang": "en", "topic": "health", "text_native": "I have a headache", "gloss_en": "Statement", "voice": "en-US-Standard-F"},
    {"id": "yo_1", "lang": "yo", "topic": "greetings", "text_native": "Ẹ káàrọ̀", "gloss_en": "Good morning", "voice": "yo-NG-Standard-A"},
    {"id": "yo_2", "lang": "yo", "topic": "greetings", "text_native": "Báwo ni?", "gloss_en": "How are you?", "voice": "yo-NG-Standard-A"},
    {"id": "yo_3", "lang": "yo", "topic": "food", "text_native": "Mo fẹ́ jẹun", "gloss_en": "I want to eat", "voice": "yo-NG-Standard-A"},
    {"id": "yo_4", "lang": "yo", "topic": "greetings", "text_native": "Ẹ ṣé", "gloss_en": "Thank you", "voice": "yo-NG-Standard-A"},
    {"id": "ig_1", "lang": "ig", "topic": "greetings", "text_native": "Ụtụtụ ọma", "gloss_en": "Good morning", "voice": "ig-NG-Standard-A"},
    {"id": "ig_2", "lang": "ig", "topic": "greetings", "text_native": "Kedu?", "gloss_en": "How are you?", "voice": "ig-NG-Standard-A"},
    {"id": "ig_3", "lang": "ig", "topic": "food", "text_native": "Biko nye m mmiri", "gloss_en": "Please give me water", "voice": "ig-NG-Standard-A"},
    {"id": "ig_4", "lang": "ig", "topic": "greetings", "text_native": "Daalụ", "gloss_en": "Thank you", "voice": "ig-NG-Standard-A"},
    {"id": "ha_1", "lang": "ha", "topic": "greetings", "text_native": "Ina kwana", "gloss_en": "Good morning", "voice": "ha-NG-Standard-A"},
    {"id": "ha_2", "lang": "ha", "topic": "greetings", "text_native": "Yaya kake?", "gloss_en": "How are you?", "voice": "ha-NG-Standard-A"},
    {"id": "ha_3", "lang": "ha", "topic": "travel", "text_native": "Ina tashar jirgi?", "gloss_en": "Where is the airport?", "voice": "ha-NG-Standard-A"},
    {"id": "ha_4", "lang": "ha", "topic": "greetings", "text_native": "Nagode", "gloss_en": "Thank you", "voice": "ha-NG-Standard-A"},
]

# --- Firestore Helpers ---
def get_phrase_doc(itemId: str):
    return db.collection('phrases').document(itemId).get()

def get_or_create_progress_doc(userId: str, itemId: str):
    progress_ref = db.collection('user_progress').document(userId).collection('phrases').document(itemId)
    progress_doc = progress_ref.get()
    if progress_doc.exists:
        return progress_doc.to_dict(), progress_ref
    else:
        phrase_doc = get_phrase_doc(itemId)
        if not phrase_doc.exists: return None, None
        defaults = {
            "ef": 2.5, "intervalDays": 0, "dueAt": datetime.now(timezone.utc),
            "lang": phrase_doc.get("lang"), "text_native": phrase_doc.get("text_native"),
            "gloss_en": phrase_doc.get("gloss_en")
        }
        progress_ref.set(defaults)
        return defaults, progress_ref

# --- SRS Logic ---
def calculate_srs(ef: float, interval: int, grade: int):
    if grade < 2:
        new_interval = 1; new_ef = max(1.3, ef - 0.2)
    else:
        new_ef = max(1.3, ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)))
        if interval == 0: new_interval = 1
        elif interval == 1: new_interval = 3
        else: new_interval = round(interval * new_ef)
    due_date = datetime.now(timezone.utc) + timedelta(days=new_interval)
    return {"ef": round(new_ef, 2), "intervalDays": new_interval, "dueAt": due_date}

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"status": "GPU API is running"}

@app.post("/api/admin/seed")
def seed_database():
    batch = db.batch()
    count = 0
    for phrase in mock_db_phrases:
        ref = db.collection('phrases').document(phrase['id'])
        batch.set(ref, phrase)
        count += 1
    batch.commit()
    return {"status": f"Seeded {count} phrases to Firestore"}

# --- TTS Caching Function ---
def get_or_create_audio(phrase_doc):
    try:
        bucket = storage_client.bucket(AUDIO_BUCKET_NAME)
        file_name = f"{phrase_doc.id}.mp3"
        blob = bucket.blob(file_name)

        if blob.exists():
            print(f"Audio cache HIT for {file_name}")
            return blob.public_url

        print(f"Audio cache MISS for {file_name}. Generating...")
        
        phrase_data = phrase_doc.to_dict()
        synthesis_input = texttospeech.SynthesisInput(text=phrase_data.get("text_native"))
        voice = texttospeech.VoiceSelectionParams(
            language_code=phrase_data.get("lang"),
            name=phrase_data.get("voice")
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        response = tts_client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        
        blob.upload_from_string(response.audio_content, content_type="audio/mpeg")
        return blob.public_url

    except Exception as e:
        print(f"Failed to generate/cache audio for {phrase_doc.id}: {e}")
        return None

class StartSessionRequest(BaseModel):
    lang: Literal["en", "yo", "ig", "ha"] = "en"
    topic: str = "greetings"
    level: str = "A1"

@app.post("/api/session/start")
def start_session(request: StartSessionRequest):
    print(f"Starting session for lang={request.lang}, topic={request.topic}")
    try:
        query = db.collection('phrases').where(filter=FieldFilter('lang', '==', request.lang)).where(filter=FieldFilter('topic', '==', request.topic))
        phrase_docs = list(query.stream())
    
        if not phrase_docs:
            print(f"No items found for topic '{request.topic}'. Falling back to 'greetings'.")
            query = db.collection('phrases').where(filter=FieldFilter('lang', '==', request.lang)).where(filter=FieldFilter('topic', '==', 'greetings'))
            phrase_docs = list(query.stream())
            
        items_to_send = []
        for doc in phrase_docs[:10]:
            item_data = doc.to_dict()
            item_data["audioUrl"] = get_or_create_audio(doc)
            items_to_send.append(item_data)

        return {
            "sessionId": f"sess_{nanoid.generate()}",
            "items": items_to_send
        }
    except Exception as e:
        print(f"Error querying Firestore: {e}")
        return {"sessionId": nanoid.generate(), "items": []}


@app.get("/api/review/next")
def get_next_reviews(userId: str, lang: str = 'en', limit: int = 10):
    now = datetime.now(timezone.utc)
    query = db.collection('user_progress').document(userId).collection('phrases') \
              .where(filter=FieldFilter('lang', '==', lang)).where(filter=FieldFilter('dueAt', '<=', now)) \
              .order_by('dueAt').limit(limit)
    items = []
    for doc in query.stream():
        item_data = doc.to_dict(); item_data['id'] = doc.id; items.append(item_data)
    return {"items": items}

class GradeRequest(BaseModel):
    userId: str; itemId: str; grade: int

@app.post("/api/review/grade")
def post_review_grade(request: GradeRequest):
    progress_data, progress_ref = get_or_create_progress_doc(request.userId, request.itemId)
    if not progress_data: return {"error": "Item not found"}
    new_srs = calculate_srs(progress_data['ef'], progress_data['intervalDays'], request.grade)
    progress_data.update(new_srs); progress_data['lastReviewed'] = datetime.now(timezone.utc)
    progress_ref.set(progress_data)
    return {"nextDueAt": new_srs['dueAt']}

class TextAttempt(BaseModel):
    itemId: str; answerText: str; userId: str

@app.post("/api/attempt/text")
async def handle_text_attempt(attempt: TextAttempt):
    print(f"Received text attempt for item: {attempt.itemId} by user: {attempt.userId}")
    phrase_doc = get_phrase_doc(attempt.itemId)
    if not phrase_doc.exists: return {"error": "Item not found", "score": 0}
    correct_text = phrase_doc.get('text_native').lower().strip()
    user_text = attempt.answerText.lower().strip()
    score = fuzz.ratio(correct_text, user_text) / 100
    
    hint = await get_ai_hint(correct_text, user_text, score)
    
    grade = 4 if score > 0.8 else 2
    progress_data, progress_ref = get_or_create_progress_doc(attempt.userId, attempt.itemId)
    new_srs = calculate_srs(progress_data['ef'], progress_data['intervalDays'], grade)
    progress_data.update(new_srs); progress_data['lastReviewed'] = datetime.now(timezone.utc)
    progress_ref.set(progress_data)
    
    return {"id": f"attempt_{nanoid.generate()}", "score": score, "hint": hint, "transcription": user_text}

@app.post("/api/attempt")
async def handle_attempt(
    audio_file: UploadFile = File(...), 
    itemId: str = Form(...),
    userId: str = Form(...)
):
    print(f"Received attempt for item: {itemId} by user: {userId}")
    phrase_doc = get_phrase_doc(itemId)
    if not phrase_doc.exists: return {"error": "Item not found", "score": 0}
    correct_text = phrase_doc.get('text_native').lower().strip()
    audio_bytes = await audio_file.read()
    transcription_result = speech_pipeline(audio_bytes)
    user_text = transcription_result["text"].lower().strip()
    score = fuzz.ratio(correct_text, user_text) / 100

    hint = await get_ai_hint(correct_text, user_text, score)
    
    grade = 4 if score > 0.8 else 2
    progress_data, progress_ref = get_or_create_progress_doc(userId, itemId)
    new_srs = calculate_srs(progress_data['ef'], progress_data['intervalDays'], grade)
    progress_data.update(new_srs); progress_data['lastReviewed'] = datetime.now(timezone.utc)
    progress_ref.set(progress_data)
    
    return {"id": f"attempt_{itemId}", "score": score, "hint": hint, "transcription": user_text}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)