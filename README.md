🚀 Operis AI – Burnout Prediction & Productivity Monitoring System
A real-time intelligent system that tracks user activity, predicts burnout risk using Machine Learning, and visualizes insights through a live dashboard.

📌 Overview

Operis-AI is a full-stack system that combines:
Hi i am dikshit hi hi
🧠 Machine Learning (burnout prediction)
🌐 Chrome Extension (user activity tracking)
⚡ FastAPI Backend (processing + APIs)
📊 React Dashboard (real-time visualization)

👉 It helps in organizations monitor productivity and detect burnout risks early.

🏗️ Architecture
Chrome Extension → FastAPI Backend → ML Model → React Dashboard

✨ Features of Operis-AI
🔍 Real-Time Tracking
Tracks user activity (time spent, tasks, meetings)
Detects current working context (websites)
🤖 ML-Based Prediction
Predicts burnout risk (Low / High)
Calculates productivity score

📊 Live Dashboard
Real-time productivity trends
Burnout distribution charts
Alerts for high-risk users

🔄 Auto Refresh
Dashboard updates every few seconds

🧠 ML Model
Model: Logistic Regression (trained on synthetic dataset)
Features:
hours_worked
meetings_count
sentiment
tasks_completed
🛠️ Tech Stack
Frontend
React (Vite)
Tailwind CSS
Recharts
Backend
FastAPI
Python
Joblib (model loading)
Extension
Chrome Extension API (Manifest v3)
📁 Project Structure
OPERIS_AI/
│
├── backend/           # FastAPI server
│   └── main.py
│
├── extension/         # Chrome extension
│   ├── background.js
│   ├── content.js
│   └── manifest.json
│
├── ml/                # ML model
│   ├── burnout_model.pkl
│   └── train_model.py
│
├── src/               # React frontend
│   ├── pages/
│   ├── components/
│   └── lib/
│
└── README.md
⚙️ Setup Instructions
🔹 1. Clone Repo
git clone https://github.com/your-username/OPERIS_AI.git
cd OPERIS_AI
🔹 2. Backend Setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

👉 Runs at:

http://127.0.0.1:8000
🔹 3. Frontend Setup
cd ..
npm install
npm run dev

👉 Runs at:

http://localhost:8080
🔹 4. Chrome Extension Setup
Go to:
chrome://extensions
Enable Developer Mode
Click Load Unpacked
Select:
/extension folder
🌐 Deployment
Frontend (Netlify)
Build command:
npm run build
Publish directory:
dist
Backend (Render)
Runtime: Python
Start command:
uvicorn main:app --host 0.0.0.0 --port 10000
🔗 API Endpoints
POST /predict

Predict burnout

{
  "hours_worked": 6,
  "meetings_count": 2,
  "sentiment": 0,
  "tasks_completed": 15
}
GET /live

Get real-time dashboard data

⚠️ Challenges Solved
CORS issues between frontend, backend, and extension
Preflight (OPTIONS) request handling
Real-time data syncing
Deployment mismatches
🚀 Future Improvements
Firebase integration (user storage)
Multi-user tracking
Real-time WebSocket updates
AI-based recommendations
Slack / Email alerts

