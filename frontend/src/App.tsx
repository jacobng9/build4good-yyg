import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Image, Type, Sparkles, Loader2, ArrowLeft, ExternalLink } from 'lucide-react'
import { parseNotes, extractConcepts, generateImages } from './api'
import type { Concept } from './types'

type AppView = 'upload' | 'processing' | 'results'

interface ProcessingStage {
  label: string
  status: 'pending' | 'active' | 'done' | 'error'
}

function App() {
  const [view, setView] = useState<AppView>('upload')
  const [textInput, setTextInput] = useState('')
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stages, setStages] = useState<ProcessingStage[]>([
    { label: 'Reading notes...', status: 'pending' },
    { label: 'Extracting concepts...', status: 'pending' },
    { label: 'Generating visuals...', status: 'pending' },
  ])

  const updateStage = (index: number, status: ProcessingStage['status']) => {
    setStages(prev => prev.map((s, i) => i === index ? { ...s, status } : s))
  }

  const processNotes = async (file?: File, text?: string) => {
    setView('processing')
    setError(null)
    setStages([
      { label: 'Reading notes...', status: 'active' },
      { label: 'Extracting concepts...', status: 'pending' },
      { label: 'Generating visuals...', status: 'pending' },
    ])

    try {
      // Step 1: Parse
      const parseResult = await parseNotes(file, text)
      updateStage(0, 'done')
      updateStage(1, 'active')

      // Step 2: Extract concepts
      const extractResult = await extractConcepts(parseResult.session_id)
      updateStage(1, 'done')
      updateStage(2, 'active')

      // Step 3: Generate images
      const generateResult = await generateImages(parseResult.session_id)
      updateStage(2, 'done')

      setConcepts(generateResult.concepts)
      setView('results')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      const axiosError = err as { response?: { data?: { detail?: string } } }
      setError(axiosError?.response?.data?.detail || message)
      setStages(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s))
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processNotes(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  })

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      processNotes(undefined, textInput.trim())
    }
  }

  const handleReset = () => {
    setView('upload')
    setConcepts([])
    setSelectedConcept(null)
    setError(null)
    setTextInput('')
    setStages([
      { label: 'Reading notes...', status: 'pending' },
      { label: 'Extracting concepts...', status: 'pending' },
      { label: 'Generating visuals...', status: 'pending' },
    ])
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-surface-border/50">
        <button onClick={handleReset} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 bg-clip-text text-transparent">
            NotesViz
          </h1>
        </button>
        {view !== 'upload' && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-surface-border hover:border-brand-500/50"
          >
            <ArrowLeft size={14} />
            New upload
          </motion.button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {/* ─── Upload View ─── */}
          {view === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-2xl"
            >
              <div className="text-center mb-10">
                <h2 className="text-4xl font-extrabold tracking-tight mb-3">
                  <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-brand-600 bg-clip-text text-transparent">
                    See your ideas
                  </span>
                </h2>
                <p className="text-gray-400 text-lg">
                  Upload your notes and watch them come alive as visuals
                </p>
              </div>

              {/* Drag & Drop Zone */}
              <div
                {...getRootProps()}
                className={`
                  relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer
                  transition-all duration-300 group
                  ${isDragActive
                    ? 'border-brand-500 bg-brand-500/10 scale-[1.02]'
                    : 'border-surface-border bg-surface-card/50 hover:border-brand-500/50 hover:bg-surface-hover/50'
                  }
                `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <div className={`
                    p-4 rounded-2xl transition-all duration-300
                    ${isDragActive ? 'bg-brand-500/20' : 'bg-surface-hover group-hover:bg-brand-500/10'}
                  `}>
                    <Upload className={`w-8 h-8 transition-colors ${isDragActive ? 'text-brand-400' : 'text-gray-500 group-hover:text-brand-400'}`} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">
                      {isDragActive ? 'Drop your file here' : 'Drag & drop your notes'}
                    </p>
                    <p className="text-gray-500 text-sm">or click to browse</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                    <span className="flex items-center gap-1"><FileText size={12} /> PDF</span>
                    <span className="flex items-center gap-1"><Image size={12} /> JPG/PNG</span>
                    <span className="flex items-center gap-1"><Type size={12} /> TXT</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-surface-border" />
                <span className="text-gray-600 text-sm font-medium">or paste your notes</span>
                <div className="flex-1 h-px bg-surface-border" />
              </div>

              {/* Text Input */}
              <div className="space-y-4">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your notes here..."
                  className="w-full h-40 bg-surface-card/50 border border-surface-border rounded-xl p-4 text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25 transition-all"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim()}
                  className={`
                    w-full py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300
                    ${textInput.trim()
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40'
                      : 'bg-surface-card text-gray-600 cursor-not-allowed'
                    }
                  `}
                >
                  <Sparkles size={16} />
                  Generate visuals
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Processing View ─── */}
          {view === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-block mb-8"
              >
                <Sparkles className="w-12 h-12 text-brand-400" />
              </motion.div>

              <h2 className="text-2xl font-bold mb-8 text-white">Processing your notes</h2>

              <div className="space-y-4">
                {stages.map((stage, idx) => (
                  <motion.div
                    key={stage.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    className={`
                      flex items-center gap-3 px-5 py-3 rounded-xl text-left transition-all
                      ${stage.status === 'active' ? 'bg-brand-500/10 border border-brand-500/30' : ''}
                      ${stage.status === 'done' ? 'bg-green-500/10 border border-green-500/20' : ''}
                      ${stage.status === 'error' ? 'bg-red-500/10 border border-red-500/20' : ''}
                      ${stage.status === 'pending' ? 'bg-surface-card/30 border border-transparent' : ''}
                    `}
                  >
                    <div className="w-6 flex items-center justify-center">
                      {stage.status === 'active' && <Loader2 size={18} className="text-brand-400 animate-spin" />}
                      {stage.status === 'done' && <span className="text-green-400">✓</span>}
                      {stage.status === 'error' && <span className="text-red-400">✕</span>}
                      {stage.status === 'pending' && <span className="text-gray-600">○</span>}
                    </div>
                    <span className={`text-sm font-medium ${
                      stage.status === 'active' ? 'text-brand-300' :
                      stage.status === 'done' ? 'text-green-300' :
                      stage.status === 'error' ? 'text-red-300' :
                      'text-gray-600'
                    }`}>
                      {stage.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <p className="text-red-300 text-sm">{error}</p>
                  <button
                    onClick={handleReset}
                    className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
                  >
                    Try again
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─── Results View ─── */}
          {view === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-6xl"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                    {concepts.length} Concepts Discovered
                  </span>
                </h2>
                <p className="text-gray-500 text-sm">Click any card to explore the concept</p>
              </div>

              {/* Concept Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {concepts.map((concept, idx) => (
                  <motion.div
                    key={concept.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                    onClick={() => setSelectedConcept(concept)}
                    className="group cursor-pointer rounded-2xl border border-surface-border bg-surface-card/60 backdrop-blur-sm overflow-hidden hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image */}
                    {concept.image_url && (
                      <div className="aspect-square overflow-hidden bg-surface-hover">
                        <img
                          src={concept.image_url}
                          alt={concept.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Text */}
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-1 group-hover:text-brand-300 transition-colors">
                        {concept.name}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{concept.definition}</p>

                      {concept.related_to.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {concept.related_to.map(relId => {
                            const relConcept = concepts.find(c => c.id === relId)
                            return relConcept ? (
                              <span key={relId} className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                                {relConcept.name}
                              </span>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Detail Panel (Modal) */}
              <AnimatePresence>
                {selectedConcept && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedConcept(null)}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                      className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-surface-card border-l border-surface-border z-50 overflow-y-auto"
                    >
                      <div className="p-6">
                        {/* Close button */}
                        <button
                          onClick={() => setSelectedConcept(null)}
                          className="mb-4 text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-1"
                        >
                          ← Back to concepts
                        </button>

                        {/* Image */}
                        {selectedConcept.image_url && (
                          <div className="rounded-xl overflow-hidden mb-6 border border-surface-border">
                            <img
                              src={selectedConcept.image_url}
                              alt={selectedConcept.name}
                              className="w-full"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <h2 className="text-2xl font-bold text-white mb-3">{selectedConcept.name}</h2>
                        <p className="text-gray-300 leading-relaxed mb-6">{selectedConcept.definition}</p>

                        {/* Related Concepts */}
                        {selectedConcept.related_to.length > 0 && (
                          <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Related Concepts</h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedConcept.related_to.map(relId => {
                                const relConcept = concepts.find(c => c.id === relId)
                                return relConcept ? (
                                  <button
                                    key={relId}
                                    onClick={() => setSelectedConcept(relConcept)}
                                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 transition-colors"
                                  >
                                    <ExternalLink size={12} />
                                    {relConcept.name}
                                  </button>
                                ) : null
                              })}
                            </div>
                          </div>
                        )}

                        {/* Image Prompt (for debugging/interest) */}
                        {selectedConcept.image_prompt && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Image Prompt</h3>
                            <p className="text-gray-500 text-sm italic bg-surface/50 rounded-lg p-3 border border-surface-border">
                              {selectedConcept.image_prompt}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
