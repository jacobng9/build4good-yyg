# NotesViz — Product Requirements Document
> Visual concept learning from your own notes, powered by AI image generation

---

## 1. Product Overview

### Problem
Students and learners struggle to form strong mental models from dense, text-heavy notes. Existing tools offer static diagrams or generic stock images that don't connect to *their* specific material.

### Solution
NotesViz lets users upload their own notes (PDF, image, text) and instantly generates rich, metaphorical illustrations for every key concept inside them — along with a visual concept map showing how ideas connect.

### Target Users
- University students (STEM, humanities, law, medicine)
- Self-learners and bootcamp students
- Teachers building visual study materials

### Core Value Proposition
> "Paste your notes. See your ideas."

---

## 2. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Fast time-to-visual | First image generated < 15s after upload |
| Concept accuracy | Gemini extracts ≥ 85% of key concepts from notes |
| User delight | Users generate ≥ 3 visuals per session |
| Hackathon demo-ability | Full flow works end-to-end in a live demo |

---

## 3. User Flow

```
1. Land on homepage
2. Upload notes (PDF / image / paste text)
3. Parsing & concept extraction runs (progress shown)
4. Concept map appears — nodes for each concept
5. Click any node → illustration generates + appears
6. Explore, zoom, click through the full map
7. (Optional) Ask follow-up questions on any concept
8. (Optional) Export as visual study guide PDF
```

---

## 4. Features

### MVP (Hackathon Scope)

| Feature | Description |
|---|---|
| **Note Upload** | Accept PDF, image (JPG/PNG), plain text paste |
| **Concept Extraction** | Gemini reads notes, returns structured list of concepts + relationships |
| **Metaphor Prompt Generation** | Gemini converts each concept into a vivid, illustration-optimized image prompt |
| **Image Generation** | Stability AI (or Imagen) renders one illustration per concept |
| **Concept Map View** | Interactive node graph — nodes are concepts, edges are relationships |
| **Concept Detail Panel** | Click node → see illustration + plain-English summary |
| **Loading States** | Animated skeleton UI during generation so it feels fast |

### Stretch Goals

| Feature | Description |
|---|---|
| **Follow-up Q&A** | Ask Gemini questions about any concept in context of your notes |
| **Quiz Mode** | Hide concept labels, guess from illustration only |
| **Export** | Download visual study guide as PDF |
| **Handwritten Notes** | Gemini Vision transcribes handwriting before extraction |
| **Concept Highlighting** | Highlight text in original notes to generate a visual on demand |

---

## 5. Technical Architecture

### High-Level System Diagram

```
┌──────────────────────────────────────────────────────┐
│                     FRONTEND                         │
│  React + Vite  |  React Flow (concept map)           │
│  TailwindCSS   |  Framer Motion (animations)         │
└─────────────────────┬────────────────────────────────┘
                      │ REST API / WebSocket
┌─────────────────────▼────────────────────────────────┐
│                     BACKEND                          │
│  FastAPI (Python)                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  /parse     │  │  /extract    │  │  /generate  │ │
│  │  endpoint   │  │  endpoint    │  │  endpoint   │ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘ │
└─────────┼───────────────┼─────────────────┼─────────┘
          │               │                 │
    ┌─────▼──────┐  ┌─────▼──────┐  ┌──────▼──────┐
    │  PyMuPDF   │  │  Gemini    │  │ Stability AI │
    │  (PDF)     │  │  1.5 Flash │  │ or Imagen   │
    │  Gemini    │  │  (extract  │  │ (image gen) │
    │  Vision    │  │  + prompt) │  │             │
    │  (images)  │  └────────────┘  └─────────────┘
    └────────────┘
```

### Backend

**Framework:** FastAPI (Python)

**Endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/parse` | Accept file upload, extract raw text |
| `POST` | `/api/extract` | Send text to Gemini, get concepts + relationships JSON |
| `POST` | `/api/generate` | Take concept list, generate image prompts, call image API |
| `GET` | `/api/status/:jobId` | Poll generation progress |
| `POST` | `/api/ask` | Follow-up Q&A on a specific concept (stretch) |

**Key Libraries:**
- `fastapi` + `uvicorn` — server
- `pymupdf` (fitz) — PDF text extraction
- `python-docx` — Word doc parsing
- `google-generativeai` — Gemini SDK
- `requests` / `stability-sdk` — image generation calls
- `pillow` — image post-processing

**Processing Pipeline (per upload):**

```python
# Step 1 — Parse
raw_text = parse_file(uploaded_file)        # PDF/image/text → string

# Step 2 — Extract concepts
concepts = gemini.extract_concepts(raw_text)
# Returns: [{ id, name, definition, related_to: [ids] }]

# Step 3 — Generate image prompts
for concept in concepts:
    concept.image_prompt = gemini.make_image_prompt(concept)
# Prompt example: "A glowing rubber sheet being stretched along fixed invisible axes,
#  surreal studio lighting, editorial illustration style"

# Step 4 — Generate images (parallelized)
async for concept in concepts:
    concept.image_url = await stability_api.generate(concept.image_prompt)
```

### Frontend

**Framework:** React + Vite

**Key Libraries:**

| Library | Use |
|---|---|
| `reactflow` | Interactive concept map / node graph |
| `tailwindcss` | Styling |
| `framer-motion` | Animations and transitions |
| `react-dropzone` | File upload UI |
| `axios` | API calls |

**Views:**

1. **Upload View** — drag-and-drop zone + text paste area
2. **Processing View** — animated progress with stage labels ("Reading notes... Extracting concepts... Generating visuals...")
3. **Concept Map View** — full-screen React Flow graph, nodes show concept name + thumbnail
4. **Detail Panel** — slides in on node click, shows full illustration + summary + related concepts

**State Management:** React Context or Zustand (lightweight)

---

## 6. API Reference

### Gemini 1.5 Flash
- **Used for:** Concept extraction, metaphor prompt generation, follow-up Q&A, handwriting transcription (Vision)
- **Free tier:** 15 RPM, 1M tokens/day — sufficient for hackathon
- **SDK:** `google-generativeai` Python package
- **Key prompts:**

*Concept extraction prompt:*
```
You are an expert educator. Given the following notes, extract all key concepts.
Return ONLY valid JSON in this format:
{
  "concepts": [
    { "id": "c1", "name": "Eigenvalue", "definition": "...", "related_to": ["c2"] }
  ]
}
Notes: {raw_text}
```

*Image prompt generation:*
```
Convert this concept into a vivid, metaphorical image generation prompt.
The image should be illustrative and help a student intuitively understand the concept.
Avoid text, charts, or diagrams. Think editorial illustration or conceptual art.
Concept: {name} — {definition}
Return only the image prompt, nothing else.
```

### Stability AI (SDXL)
- **Used for:** Image generation
- **Free tier:** 25 free credits on signup, ~$0.002/image after
- **Endpoint:** `https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`
- **Recommended params:** `width: 1024, height: 1024, steps: 30, cfg_scale: 7`

### Alternative Image APIs
| API | Free Tier | Notes |
|---|---|---|
| Stability AI | 25 free credits | Best quality, easy REST API |
| Google Imagen | Gemini API quota | Requires Vertex AI setup |
| Pollinations.ai | Unlimited (free) | No key needed, good for hackathon |
| Hugging Face Inference | Free tier | SDXL available, slower |

**Recommendation for hackathon:** Use `https://image.pollinations.ai/prompt/{encoded_prompt}` — zero setup, no API key, returns image directly. Swap for Stability AI before demo for quality.

---

## 7. Data Models

```typescript
// Concept
interface Concept {
  id: string
  name: string
  definition: string
  related_to: string[]       // array of concept IDs
  image_prompt: string
  image_url: string | null   // null until generated
  status: "pending" | "generating" | "done" | "error"
}

// Session
interface Session {
  id: string
  raw_text: string
  concepts: Concept[]
  created_at: string
}

// API Response — /api/extract
interface ExtractResponse {
  session_id: string
  concepts: Concept[]
}
```

---

## 8. Team Roles

| Person | Area | Tasks |
|---|---|---|
| **P1 — Ingestion** | Backend | File upload endpoint, PDF/image/text parsing, Gemini Vision for handwriting |
| **P2 — AI Pipeline** | Backend | Gemini concept extraction, prompt engineering, parallelized image generation calls |
| **P3 — Frontend Core** | Frontend | Upload view, processing view, API integration, state management |
| **P4 — Concept Map** | Frontend | React Flow graph, node design, detail panel, animations |
| **P5+ — Polish** | Full-stack | Export PDF, quiz mode, error handling, demo prep |

---

## 9. Build Order (24-hour hackathon)

### Hour 0–2: Setup
- [ ] Init FastAPI backend + React frontend repos
- [ ] Set up Gemini API key + test concept extraction prompt
- [ ] Set up Pollinations.ai image URL (zero config)
- [ ] Define shared data models

### Hour 2–6: Core Pipeline
- [ ] `/api/parse` working for PDF + text paste
- [ ] `/api/extract` returns concept JSON from Gemini
- [ ] `/api/generate` calls image API, returns URLs
- [ ] Basic React UI renders list of concepts + images

### Hour 6–12: Concept Map
- [ ] React Flow graph renders concepts as nodes
- [ ] Edges drawn from `related_to` relationships
- [ ] Click node → detail panel with image + definition
- [ ] Loading/progress states

### Hour 12–18: Polish & Edge Cases
- [ ] Handle Gemini errors gracefully
- [ ] Image fallback if generation fails
- [ ] File type validation
- [ ] Animations (Framer Motion)
- [ ] Mobile-responsive layout

### Hour 18–22: Stretch Features
- [ ] Follow-up Q&A per concept
- [ ] Handwritten notes via Gemini Vision
- [ ] Export view

### Hour 22–24: Demo Prep
- [ ] Curate 2–3 demo note sets (linear algebra, biology, history)
- [ ] Test full flow end-to-end
- [ ] Prepare pitch talking points

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Image generation is slow | Parallelize all image calls; show concept map immediately, images load in async |
| Gemini extracts too many/few concepts | Add a "max concepts" param (default 8) to keep demo snappy |
| Pollinations.ai is unreliable | Have Stability AI as backup; cache all generated images |
| PDF parsing fails on complex layouts | Fall back to Gemini Vision for any failed PDF parse |
| Rate limits hit during demo | Pre-generate demo sessions and cache results |

---

## 11. Future Vision (Post-Hackathon)

- **Spaced repetition integration** — quiz you on concepts over time using your own visuals
- **Collaborative mode** — share visual study guides with classmates
- **LMS plugins** — Canvas / Notion integration
- **Teacher dashboard** — upload a lecture, auto-generate visual handouts
- **Multi-language support** — notes in any language, visuals generated in same language context

---

*Built at [Hackathon Name] · [Date] · Team: [Names]*
