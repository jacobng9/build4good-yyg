# NotesViz

NotesViz is an intelligent, visual studying application that converts dense engineering, math, and general notes into interactive, metaphorical concept maps. Designed for the Build4Good YYG Hackathon, our platform enables visual learners to grasp complex topics by bridging abstract definitions to concrete, AI-generated imagery and structured relationships.

## Features

- **Document Parsing**: Upload your course notes (PDF/Text) or capture images of whiteboard sessions to extract raw text automatically.
- **Concept Extraction**: Leveraging Groq and open-weights LLMs to parse unstructured notes into distinct concepts and definitions.
- **Visual Mind-Mapping**: An interactive UI powered by React Flow that renders nodes representing concepts and dynamic edges to show their relationships.
- **AI-Powered Imagery**: Every concept gets an auto-generated visual representation from Pollinations.ai to bridge the gap between theoretical definitions and intuitive understanding.
- **Tutor Q&A**: Drill down into specific nodes with an AI tutor to ask deeper follow-up questions within the context of your original notes.

## Architecture

Our application adopts a modern decoupled frontend/backend architecture to ensure scalability, fast parsing, and a highly interactive UI:

### Frontend
- **Framework**: Built with React and Vite for blazing-fast HMR and optimized production builds.
- **Styling & UI**: Tailwind CSS for responsive components, Framer Motion for buttery-smooth page transitions, and Lucide Icons for iconography.
- **Graph Visualization**: Integrated **React Flow** to power the interactive concept mapping, dragging, connecting, and rendering custom image-based nodes.
- **Routing**: `react-router-dom` for handling multi-page navigation cleanly.

### Backend
- **Framework**: **FastAPI** (Python) for a high-performance concurrent API.
- **AI Pipelines**:
  - Information Extraction & NLP: **Groq API** running the `llama-3.3-70b-versatile` model to dissect text into structured JSON (concepts and relations) at lightning speed.
  - Image Captioning: `llama-3.2-11b-vision-preview` to transcribe handwritten text from images.
  - Image Generation: Proxies requests to **Pollinations.ai** (`flux` model) to render educational imagery on the fly without complex generation queues on the backend.
- **Parsers**: PyMuPDF (`fitz`) handles rapid unstructured PDF text extraction.

### Infrastructure & Workflow
- Cross-origin resource sharing (CORS) manages secure frontend-backend communication.
- Stateless, session-based interactions.

## Setup & Running Locally

### Backend Setup
1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # Windows
   # source venv/bin/activate    # Mac/Linux
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up Environment Variables:
   Create a `.env` file in the `backend/` directory:
   ```env
   GROQ_API_KEY=your_groq_api_key
   ```
5. Run the server:
   ```bash
   python main.py
   # Runs on http://0.0.0.0:8000
   ```

### Frontend Setup
1. Navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   # Runs on http://localhost:5173
   ```

## The Team

Built with ❤️ by:
- Preston Nguyen (Developer)
- Rei Iwata (Developer)
- Jacob Ng (Developer)
- Ethan Ho (Developer)
