# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Install ffmpeg (needed for audio processing)
RUN apt-get update && apt-get install -y ffmpeg && apt-get clean

# Copy ONLY the requirements and download script first
# These files are at the root of the build context (which is ./apps/api-gpu)
COPY requirements.txt download_model.py ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# --- Download the model during the build ---
RUN python download_model.py

# Now copy the rest of the application code
COPY . .

# Cloud Run provides the PORT env var. Default to 8080 if not set.
ENV PORT 8080
EXPOSE 8080

# Use shell form to correctly substitute the $PORT variable
CMD uvicorn main:app --host 0.0.0.0 --port $PORT