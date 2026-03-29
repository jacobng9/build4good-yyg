// ─── Data Models (from PRD Section 7) ────────────────────────────────────────

export interface Example {
  problem: string
  solution: string
}

export interface Concept {
  id: string
  name: string
  definition: string
  equations: string[]
  examples: Example[]
  related_to: string[]
  image_prompts: string[]
  image_urls: string[]
  status: 'pending' | 'generating' | 'done' | 'error'
}

export interface Session {
  id: string
  raw_text: string
  concepts: Concept[]
  created_at: string
}

export interface ExtractResponse {
  session_id: string
  concepts: Concept[]
}

export interface ParseResponse {
  session_id: string
  raw_text: string
}

export interface GenerateResponse {
  session_id: string
  status: string
  message: string
  concepts: Concept[]
}

export interface StatusResponse {
  job_id: string
  total: number
  done: number
  status: 'in_progress' | 'complete'
}

export interface AskRequest {
  session_id: string
  concept_id: string
  question: string
}

export interface AskResponse {
  answer: string
}
