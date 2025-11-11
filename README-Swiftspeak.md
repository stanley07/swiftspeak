# 🗣️ Swiftspeak

**Live App:** [https://swiftspeak-web-810892273139.us-central1.run.app](https://swiftspeak-web-810892273139.us-central1.run.app)  
**Submission:** Cloud Run Hackathon 2025  
**Author:** Stanley Okafor  
**Date:** November 11, 2025

---

## 🚀 Overview

**Swiftspeak** is an AI‑powered voice learning and pronunciation feedback web app built on **Google Cloud Run**.  
It enables users to record or upload speech, receive instant transcription via **Google Cloud Speech‑to‑Text**, and get feedback using a **Vertex AI** custom pronunciation scoring model.

---

## 🧩 Architecture

![Architecture Diagram](./swiftspeak-architecture.png)

**Components**
- **Frontend (swiftspeak‑web)** — Next.js 13 + Tailwind CSS hosted on Cloud Run  
- **Backend (swiftspeak‑api)** — Node.js (Express / NestJS) microservice running on Cloud Run  
- **Artifact Registry** — stores built Docker images  
- **Cloud Build** — CI/CD for automatic container builds and deployments  
- **Cloud Storage** — stores uploaded audio files  
- **Secret Manager** — secures API keys and credentials  
- **Vertex AI + Speech‑to‑Text API** — provide the core AI/ML speech processing logic  

---

## ⚙️ Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Frontend** | Next.js, React, Tailwind CSS, TypeScript |
| **Backend** | Node.js, Express / NestJS |
| **Database / Auth** | Supabase (PostgreSQL) |
| **Containerization** | Docker (multi‑stage builds) |
| **Cloud Platform** | Google Cloud Run, Cloud Build, Artifact Registry, Cloud Storage |
| **AI Models** | Google Cloud Speech‑to‑Text API, Google Vertex AI custom model |
| **Version Control** | Git + GitHub |

---

## 🧠 Features

- 🎤 **Real‑Time Speech Analysis** — Upload or record your voice and get transcription + feedback.  
- 💬 **AI Feedback** — Pronunciation scoring via Vertex AI custom model.  
- ⚡ **Serverless & Scalable** — Entirely powered by Google Cloud Run microservices.  
- 🔐 **Secure** — Managed secrets and authentication through Supabase & GCP Secret Manager.  
- 🧱 **Modular Architecture** — Separate frontend and backend services for flexibility and scaling.

---

## 📦 Local Development

```bash
# 1. Clone repository
git clone https://github.com/<your-username>/swiftspeak.git
cd swiftspeak

# 2. Install dependencies
pnpm install

# 3. Build SDKs / packages if monorepo
pnpm --filter @swiftspeak/sdk build

# 4. Run locally (frontend)
pnpm dev

# 5. Run backend locally (if separate)
cd apps/api && pnpm start
```

---

## ☁️ Deploying to Cloud Run

```bash
# Build image
gcloud builds submit . --tag us-central1-docker.pkg.dev/swift123/swiftspeak/swiftspeak-api:latest

# Deploy
gcloud run deploy swiftspeak-api   --image us-central1-docker.pkg.dev/swift123/swiftspeak/swiftspeak-api:latest   --region us-central1   --allow-unauthenticated
```

---

## 🧾 License

MIT License © 2025 Stanley Okafor

---

## 💬 Connect

- **Author:** Stanley Okafor  
- **Email:** ezebo001@gmail.com  
- **Phone:** +2348064712936  
- **GitHub:** [https://github.com/stanleyokafor](https://github.com/stanleyokafor)  
- **LinkedIn:** [https://linkedin.com/in/stanleyokafor](https://linkedin.com/in/stanleyokafor)
