import { useState } from 'react'
import { motion } from 'framer-motion'

type AppView = 'upload' | 'processing' | 'map'

function App() {
  const [_view, _setView] = useState<AppView>('upload')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center max-w-2xl"
      >
        {/* Logo / Title */}
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 bg-clip-text text-transparent">
            NotesViz
          </span>
        </h1>
        <p className="text-lg text-gray-400 mb-10">
          Paste your notes. See your ideas.
        </p>

        {/* Placeholder — Upload view will go here */}
        <div className="rounded-2xl border-2 border-dashed border-surface-border bg-surface-card/50 backdrop-blur-sm p-16 transition-colors hover:border-brand-500/50 hover:bg-surface-hover/50 cursor-pointer">
          <p className="text-gray-500 text-sm">
            Upload view coming soon — drag &amp; drop your notes here
          </p>
        </div>

        <p className="mt-8 text-xs text-gray-600">
          Supports PDF, images (JPG/PNG), and plain text
        </p>
      </motion.div>
    </div>
  )
}

export default App
