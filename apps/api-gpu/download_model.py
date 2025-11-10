import os
from huggingface_hub import snapshot_download

model_id = "distil-whisper/distil-large-v3"
local_dir = "/app/model"

if not os.path.exists(local_dir):
    os.makedirs(local_dir)

print(f"Downloading model {model_id} to {local_dir}...")
snapshot_download(repo_id=model_id, local_dir=local_dir)
print("Model download complete.")
