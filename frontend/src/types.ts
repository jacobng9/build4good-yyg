// ─── Data Models (from PRD Section 7) ────────────────────────────────────────

export interface Concept {
  id: string
  name: string
  definition: string
  related_to: string[]
  image_prompt: string | null
  image_url: string | null
  status: 'pending' | 'generating' | 'done' | 'error'
}

export interface Session {
  session_id: string
  raw_text: string
  concepts: Concept[]
}

export interface ParseResponse {
  session_id: string
  raw_text: string
}

export interface ExtractResponse {
  session_id: string
  concepts: Concept[]
}

export interface GenerateResponse {
  session_id: string
  concepts: Concept[]
}

export interface AskResponse {
  answer: string
}
