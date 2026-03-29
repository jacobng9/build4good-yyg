import axios from 'axios'
import type { ParseResponse, ExtractResponse, GenerateResponse, AskResponse } from './types'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 minutes — Gemini calls can be slow
})

/**
 * Parse uploaded notes (file or text) and get a session ID.
 */
export async function parseNotes(file?: File, text?: string): Promise<ParseResponse> {
  const formData = new FormData()
  if (file) {
    formData.append('file', file)
  }
  if (text) {
    formData.append('text', text)
  }
  const response = await api.post<ParseResponse>('/parse', formData)
  return response.data
}

/**
 * Extract concepts from the parsed session text via Gemini.
 */
export async function extractConcepts(sessionId: string): Promise<ExtractResponse> {
  const formData = new FormData()
  formData.append('session_id', sessionId)
  const response = await api.post<ExtractResponse>('/extract', formData)
  return response.data
}

/**
 * Generate image prompts and URLs for all concepts in a session.
 */
export async function generateImages(sessionId: string): Promise<GenerateResponse> {
  const formData = new FormData()
  formData.append('session_id', sessionId)
  const response = await api.post<GenerateResponse>('/generate', formData)
  return response.data
}

/**
 * Ask a follow-up question about a specific concept.
 */
export async function askQuestion(sessionId: string, conceptId: string, question: string): Promise<AskResponse> {
  const response = await api.post<AskResponse>('/ask', {
    session_id: sessionId,
    concept_id: conceptId,
    question,
  })
  return response.data
}
