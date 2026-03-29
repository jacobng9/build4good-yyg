import React from 'react';
import { motion } from 'framer-motion';

const HomeView = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
          >
            Learn visually with <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              NotesViz
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 max-w-2xl mx-auto text-xl text-gray-400 mb-10"
          >
            Transform your engineering and mathematics notes into interactive, 
            AI-generated concept maps. Understand complex relationships instantly.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => onNavigate('app')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
            >
              Start Generating
            </button>
          </motion.div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Features Section */}
      <div className="bg-gray-800/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: 'Instant Extraction',
                desc: 'Upload PDFs or paste text. Our AI instantly identifies key concepts and relationships.',
                icon: '⚡'
              },
              {
                title: 'Visual Mapping',
                desc: 'Creates an interactive graph of your notes, making complex topics easy to digest.',
                icon: '🗺️'
              },
              {
                title: 'Generative Art',
                desc: 'Generates specific illustrative visuals for every concept to aid memory retention.',
                icon: '🎨'
              }
            ].map((f, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl p-8 border border-gray-700 hover:border-blue-500/50 transition-colors">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
