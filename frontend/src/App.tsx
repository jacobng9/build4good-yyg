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

const renderMathText = (text: string) => {
  if (!text) return text;
  // Splits by $math$ blocks, keeping the block intact in the array
  const parts = text.split(/(\$[^$]+\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const latex = part.slice(1, -1);
      if (typeof (window as any).katex !== 'undefined') {
        try {
          const html = (window as any).katex.renderToString(latex, { throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="text-blue-100 tracking-wide px-0.5 inline-block" />;
        } catch(e) {}
      }
      return (
        <span key={index} className="font-serif italic text-blue-200 tracking-wide px-0.5">
          {latex}
        </span>
      );
    }
    // Render normal bold markdown like **word** safely
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={index}>
        {boldParts.map((bPart, bIndex) => {
          if (bPart.startsWith('**') && bPart.endsWith('**')) {
            return <strong key={bIndex} className="text-white font-semibold">{bPart.slice(2, -2)}</strong>;
          }
          return <span key={bIndex}>{bPart}</span>;
        })}
      </span>
    );
  });
};

const renderKaTeX = (latex: string) => {
  if (typeof (window as any).katex !== 'undefined') {
    try {
      const html = (window as any).katex.renderToString(latex, { throwOnError: false, displayMode: true });
      return <div dangerouslySetInnerHTML={{ __html: html }} className="text-blue-100 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] w-full overflow-x-auto text-center" />;
    } catch(e) {}
  }
  return <span className="font-serif italic tracking-wider text-xl text-blue-100 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">{latex}</span>;
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
      await extractConcepts(parseResult.session_id)
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
                    <span className={`text-sm font-medium ${stage.status === 'active' ? 'text-brand-300' :
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
                    {concept.image_urls && concept.image_urls.length > 0 && (
                      <div className="aspect-square overflow-hidden bg-surface-hover">
                        <img
                          src={concept.image_urls[0]}
                          alt={concept.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Text */}
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-1 group-hover:text-brand-300 transition-colors">
                        {renderMathText(concept.name)}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{renderMathText(concept.definition)}</p>

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

                        {/* Image Carousel */}
                        {selectedConcept.image_urls && selectedConcept.image_urls.length > 0 && (
                          <div className="mb-6 space-y-2">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Visual Perspectives</h3>
                            <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-4" style={{ scrollbarWidth: 'none' }}>
                              {selectedConcept.image_urls.map((imgUrl, i) => (
                                <div key={i} className="shrink-0 w-full sm:w-[85%] rounded-xl overflow-hidden border border-surface-border snap-center relative group bg-surface-hover">
                                  <img
                                    src={imgUrl}
                                    alt={`${selectedConcept.name} perspective ${i+1}`}
                                    className="w-full h-auto aspect-square object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <p className="text-[10px] text-brand-300 font-medium tracking-widest leading-relaxed font-serif uppercase line-clamp-4">
                                      {selectedConcept.image_prompts?.[i]}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-center gap-1.5 mt-[-10px] pb-4">
                              {selectedConcept.image_urls.map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-500/50"></div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        <h2 className="text-2xl font-bold text-white mb-3">{renderMathText(selectedConcept.name)}</h2>
                        <p className="text-gray-300 leading-relaxed mb-6 whitespace-pre-line">{renderMathText(selectedConcept.definition)}</p>

                        {/* Equations */}
                        {selectedConcept.equations && selectedConcept.equations.length > 0 && (
                          <div className="mb-6 space-y-3">
                            <h3 className="text-sm font-semibold text-brand-300 uppercase tracking-wider">Key Equations</h3>
                            {selectedConcept.equations.map((eq, i) => (
                              <div key={i} className="flex justify-center items-center py-4 px-2 bg-black/40 border border-brand-500/20 rounded-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] overflow-x-auto">
                                {renderKaTeX(eq)}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Examples */}
                        {selectedConcept.examples && selectedConcept.examples.length > 0 && (
                          <div className="mb-8 space-y-4">
                            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider">Example Problem</h3>
                            {selectedConcept.examples.map((ex, i) => (
                              <div key={i} className="bg-surface-border/30 border border-surface-border rounded-xl p-4 shadow-sm">
                                <p className="text-sm font-medium text-white mb-3 pb-3 border-b border-surface-border/50 text-balance">
                                  <span className="text-gray-400 mr-2 font-bold tracking-widest">Q:</span> {renderMathText(ex.problem)}
                                </p>
                                <p className="text-sm text-gray-300 leading-relaxed text-balance">
                                  <span className="text-green-400 mr-2 font-bold tracking-widest">A:</span> {renderMathText(ex.solution)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

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
