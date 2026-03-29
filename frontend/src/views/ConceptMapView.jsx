import React, { useState, useCallback, useContext, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Image as ImageIcon, MessageSquare, Send } from 'lucide-react';
import { SessionContext } from '../SessionContext';
import axios from 'axios';

const API_BASE = '/api';

// Custom node component for concept nodes
const ConceptNode = ({ data, selected }) => {
  const { concept, onClick } = data;
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      onClick={() => onClick(concept)}
      className={`
        w-56 rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative
        ${selected ? 'border-blue-500 shadow-lg shadow-blue-500/30' : 'border-gray-700 hover:border-blue-400/60'}
        bg-gray-800/90 backdrop-blur-sm
      `}
      style={{ minWidth: 220 }}
    >
      {/* Image Container */}
      <div className="w-full h-40 overflow-hidden bg-gray-900 relative">
        {concept.image_url && !imgError ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse" />
            )}
            <img
              src={concept.image_url}
              alt={concept.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setImgError(true);
                setIsLoading(false);
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <ImageIcon className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-xs font-medium px-2">{concept.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="p-3 border-t border-gray-700">
        <h3 className="font-semibold text-white text-sm truncate">
          {concept.name}
        </h3>
        <p className="text-gray-400 text-xs mt-1 line-clamp-2">
          {concept.definition}
        </p>
      </div>
    </div>
  );
};

// Define custom node types OUTSIDE component to avoid re-renders
const nodeTypes = {
  concept: ConceptNode,
};

const ConceptMapView = ({ onNavigate }) => {
  const { session, setSession } = useContext(SessionContext);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Q&A state
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Transform session concepts into ReactFlow nodes and edges
  const { flowNodes, flowEdges } = useMemo(() => {
    if (!session?.concepts?.length) {
      return { flowNodes: [], flowEdges: [] };
    }

    const conceptMap = {};
    const nodesData = [];
    const edgesData = [];

    // Create node for each concept
    session.concepts.forEach((concept, index) => {
      conceptMap[concept.id] = concept;

      // Circular layout for better visual
      const count = session.concepts.length;
      const radius = Math.max(300, count * 60);
      const angle = (2 * Math.PI * index) / count - Math.PI / 2;
      const x = Math.cos(angle) * radius + radius;
      const y = Math.sin(angle) * radius + radius;

      nodesData.push({
        id: concept.id,
        type: 'concept',
        position: { x, y },
        data: {
          concept,
          onClick: setSelectedConcept,
        },
      });
    });

    // Create edges from relationships
    session.concepts.forEach((concept) => {
      if (concept.related_to && Array.isArray(concept.related_to)) {
        concept.related_to.forEach((relatedId) => {
          if (
            conceptMap[relatedId] &&
            !edgesData.find(
              (e) =>
                (e.source === concept.id && e.target === relatedId) ||
                (e.source === relatedId && e.target === concept.id)
            )
          ) {
            edgesData.push({
              id: `${concept.id}-${relatedId}`,
              source: concept.id,
              target: relatedId,
              type: 'smoothstep',
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#6366f1',
              },
              style: { stroke: '#6366f1', strokeWidth: 2, opacity: 0.6 },
            });
          }
        });
      }
    });

    return { flowNodes: nodesData, flowEdges: edgesData };
  }, [session]);

  // Update nodes and edges when data changes
  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  // Close detail panel
  const handleCloseDetail = () => {
    setSelectedConcept(null);
    setQuestion('');
    setAnswer('');
  };

  // Navigate to related concept from detail panel
  const handleRelatedClick = (conceptId) => {
    const relatedConcept = session.concepts.find((c) => c.id === conceptId);
    if (relatedConcept) {
      setSelectedConcept(relatedConcept);
      setQuestion('');
      setAnswer('');
    }
  };

  // Ask follow-up question
  const handleAsk = async () => {
    if (!question.trim() || !selectedConcept || isAsking) return;

    setIsAsking(true);
    setAnswer('');

    try {
      const response = await axios.post(`${API_BASE}/ask`, {
        session_id: session.session_id,
        concept_id: selectedConcept.id,
        question: question.trim(),
        raw_text: session.raw_text || '',
        concepts: session.concepts,
      });
      setAnswer(response.data.answer);
    } catch (err) {
      setAnswer('Sorry, I could not answer that question. Please try again.');
    } finally {
      setIsAsking(false);
    }
  };

  if (!session?.concepts?.length) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No concepts available</h2>
          <button
            onClick={() => {
              setSession(null);
              onNavigate('upload');
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm z-10 relative">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            NotesViz
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {session.concepts.length} concepts
          </span>
          <button
            onClick={() => {
              setSession(null);
              onNavigate('upload');
            }}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
          >
            New Upload
          </button>
        </div>
      </header>

      {/* React Flow Container */}
      <div className="w-full" style={{ height: 'calc(100vh - 65px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#374151" gap={20} size={1} />
          <Controls
            style={{
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
          />
          <MiniMap
            nodeColor={() => '#4f46e5'}
            style={{
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
            maskColor="rgba(0,0,0,0.6)"
          />
        </ReactFlow>
      </div>

      {/* Detail Panel (right-side slide-in) */}
      <AnimatePresence>
        {selectedConcept && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDetail}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-gray-800/95 backdrop-blur-xl border-l border-gray-700 z-50 overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                {/* Close Button */}
                <button
                  onClick={handleCloseDetail}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>

                {/* Concept Image */}
                {selectedConcept.image_url ? (
                  <div className="rounded-xl overflow-hidden mb-6 border border-gray-700 shadow-lg">
                    <img
                      src={selectedConcept.image_url}
                      alt={selectedConcept.name}
                      className="w-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden mb-6 border border-gray-700 shadow-lg bg-gray-900 aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">{selectedConcept.name}</p>
                    </div>
                  </div>
                )}

                {/* Content */}
                <h2 className="text-2xl font-bold text-white mb-3 pr-8">
                  {selectedConcept.name}
                </h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                  {selectedConcept.definition}
                </p>

                {/* Related Concepts */}
                {selectedConcept.related_to && selectedConcept.related_to.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                      Related Concepts
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedConcept.related_to.map((relId) => {
                        const relConcept = session.concepts.find((c) => c.id === relId);
                        if (!relConcept) return null;
                        return (
                          <button
                            key={relId}
                            onClick={() => handleRelatedClick(relId)}
                            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all"
                          >
                            <ExternalLink size={12} />
                            {relConcept.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Follow-up Q&A */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare size={14} />
                    Ask a Question
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                      placeholder="Ask about this concept..."
                      className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAsk}
                      disabled={isAsking || !question.trim()}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      {isAsking ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                  {answer && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3"
                    >
                      <p className="text-blue-200 text-sm leading-relaxed">{answer}</p>
                    </motion.div>
                  )}
                </div>

                {/* Image Prompt */}
                {selectedConcept.image_prompt && !selectedConcept.image_prompt.startsWith('Error') && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      Image Prompt
                    </h3>
                    <p className="text-gray-500 text-sm italic bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                      {selectedConcept.image_prompt}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConceptMapView;