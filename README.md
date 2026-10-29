# EmergencyAI: Call Center Decision Support System

A complete full-stack prototype of a Human–AI Collaboration System for emergency call centers. This system assists human operators by processing emergency calls, identifying the intent, assessing severity, extracting important entities, retrieving relevant protocols, and suggesting actions. The human operator retains the ultimate authority through a "Human-in-the-Loop" workflow.

## Features

- **Speech-to-Text**: Converts emergency call audio to text (uses Whisper if available, with a demo fallback).
- **AI/NLP Pipeline**: Preprocesses text, classifies intent and severity, and extracts entities (location, people, injuries, etc.). Built to work entirely locally via heuristic rules as a solid demo fallback.
- **RAG Protocol Retrieval**: Retrieves standard operating procedures from a local knowledge base.
- **Human-in-the-Loop**: Operator reviews the AI recommendation and can ACCEPT, MODIFY, or REJECT it.
- **Dashboard & Analytics**: Real-time overview of active calls, call history, and AI performance metrics.

## Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Recharts, Axios, React Router.
- **Backend**: Python, FastAPI, Uvicorn, Pydantic.
- **Database**: MongoDB (via Motor) with automatic fallback to local JSON file storage (TinyDB) if MongoDB is not running.

## Project Structure

```
emergency-ai-system/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   └── data/ (protocols.json, sample_calls.json)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## Installation & Setup

### 1. Backend Setup

Open a terminal and run the following commands:

```bash
cd backend
python -m venv venv
# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload
```

The backend API will run at `http://localhost:8000`. API Docs are available at `http://localhost:8000/docs`.

### 2. Frontend Setup

Open a new terminal and run the following commands:

```bash
cd frontend
npm install

# Start the Vite dev server
npm run dev
```

The frontend application will be available at `http://localhost:5173`.

### 3. Environment Variables (Optional)

The backend creates a `.env` file from `.env.example` automatically. 
- You do NOT need MongoDB installed to run this project. It will automatically detect if MongoDB is missing and fall back to local JSON storage (`backend/app/data/calls_db.json`).
- You do NOT need heavy ML models to run the demo. The system falls back to heuristic NLP and demo transcripts.

## How to Run & Test

1. Navigate to the frontend UI (`http://localhost:5173`).
2. Log in using the demo credentials:
   - Email: `operator@emergency.ai`
   - Password: `operator123`
3. Go to the **Live Call** page.
4. Click **"Load sample emergency call"** to populate the transcript.
   *(Or type your own emergency message like: "Fire in the building on main street, 5 people trapped.")*
5. Click **"Analyze Call"**.
6. Watch the processing pipeline indicators. The AI Analysis Results and Protocol will appear on the right.
7. The **Operator Decision Required** panel will appear at the bottom.
8. Test the Human-in-the-Loop workflow by clicking **Accept**, **Modify**, or **Reject**.
9. Explore the **Call History** and **Analytics** pages to see the recorded data and charts.

## AI Fallback Mode

If heavy ML libraries (like `whisper` or `transformers`) are not installed or cannot be loaded:
- **Speech-to-Text**: Automatically uses a hardcoded demo transcript.
- **Intent & Severity**: Uses a robust keyword-heuristic algorithm that effectively simulates model behavior without requiring a GPU or large model downloads.

## Future Improvements

- Integrate actual LLM APIs (e.g., OpenAI, Anthropic, or local LLaMA) for advanced RAG.
- Implement real-time WebSockets for live audio streaming.
- Integrate full GPS mapping/routing.
- Connect to a genuine SIP/VoIP telecom provider.
