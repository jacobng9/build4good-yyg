import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { SessionContext } from '../SessionContext';
import axios from 'axios';

const API_BASE = '/api';

const ProcessingView = ({ onNavigate }) => {
  const { session, setSession } = useContext(SessionContext);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState(null);

  const stages = [
    'Reading notes...',
    'Extracting concepts...',
    'Generating visuals...',
  ];

  useEffect(() => {
    // Guard: if there's no session or no concepts, go back
    if (!session?.concepts?.length) {
      return;
    }

    let cancelled = false;

    const generateImages = async () => {
      try {
        // Stages 0 and 1 are already done (parse + extract happened in UploadView)
        setCurrentStage(0);
        await new Promise((r) => setTimeout(r, 400));
        if (cancelled) return;

        setCurrentStage(1);
        await new Promise((r) => setTimeout(r, 400));
        if (cancelled) return;

        setCurrentStage(2);

        // Stage 3: Generate images — send JSON body with concepts
        const generateResponse = await axios.post(`${API_BASE}/generate`, {
          session_id: session.session_id,
          concepts: session.concepts,
        });

        if (cancelled) return;

        // Update session with concepts that now have image_url
        setSession({
          ...session,
          concepts: generateResponse.data.concepts,
        });

        setCurrentStage(3); // All done

        // Navigate to results after a brief moment
        setTimeout(() => {
          if (!cancelled) onNavigate('results');
        }, 800);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.detail || 'Failed to generate images. Make sure the backend is running.'
          );
        }
      }
    };

    generateImages();

    return () => {
      cancelled = true;
    };
  }, []); // Run once on mount

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            NotesViz
          </h1>
          <p className="mt-2 text-gray-400">Transforming your notes into visuals</p>
        </div>

        {/* Animated Icon */}
        <div className="flex justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="p-6 bg-blue-500/10 rounded-full"
          >
            <Sparkles className="w-16 h-16 text-blue-400" />
          </motion.div>
        </div>

        {/* Stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            let stageStatus = 'pending';
            if (error && index === currentStage) stageStatus = 'error';
            else if (index < currentStage) stageStatus = 'done';
            else if (index === currentStage && currentStage < stages.length) stageStatus = 'active';

            return (
              <motion.div
                key={stage}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border transition-all
                  ${stageStatus === 'active' ? 'bg-blue-500/10 border-blue-500/30' : ''}
                  ${stageStatus === 'done' ? 'bg-green-500/10 border-green-500/20' : ''}
                  ${stageStatus === 'error' ? 'bg-red-500/10 border-red-500/30' : ''}
                  ${stageStatus === 'pending' ? 'bg-gray-800/50 border-gray-700/50' : ''}
                `}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {stageStatus === 'active' && (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  )}
                  {stageStatus === 'done' && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                  {stageStatus === 'error' && (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  {stageStatus === 'pending' && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                  )}
                </div>
                <span
                  className={`font-medium ${
                    stageStatus === 'active'
                      ? 'text-blue-300'
                      : stageStatus === 'done'
                      ? 'text-green-300'
                      : stageStatus === 'error'
                      ? 'text-red-300'
                      : 'text-gray-500'
                  }`}
                >
                  {stage}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Concept count during generation */}
        {currentStage >= 2 && session?.concepts?.length > 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-gray-400 text-sm"
          >
            Generating visuals for {session.concepts.length} concepts...
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/30 border border-red-500/30 rounded-xl p-4"
          >
            <p className="text-red-300 text-sm">{typeof error === 'string' ? error : JSON.stringify(error)}</p>
            <button
              onClick={() => onNavigate('upload')}
              className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Completion Message */}
        {currentStage === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <p className="text-green-300 font-medium mb-2">✓ All visuals generated!</p>
            <p className="text-gray-400 text-sm">Loading your concept map...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProcessingView;