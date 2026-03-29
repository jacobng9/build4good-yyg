import React, { useState, useCallback, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { SessionContext } from '../SessionContext';
import axios from 'axios';

const API_BASE = '/api';

const UploadView = ({ onNavigate }) => {
  const { setSession } = useContext(SessionContext);
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setText('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  const handleTextChange = (e) => {
    setText(e.target.value);
    setFile(null);
  };

  const handleSubmit = async () => {
    if (!file && !text.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Parse — upload file or text
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('text', text);
      }
      const parseResponse = await axios.post(`${API_BASE}/parse`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Step 2: Extract concepts — send JSON body
      const extractResponse = await axios.post(`${API_BASE}/extract`, {
        session_id: parseResponse.data.session_id,
        raw_text: parseResponse.data.raw_text,
      });

      // Save to session context (includes session_id, concepts, and raw_text)
      setSession({
        session_id: extractResponse.data.session_id,
        concepts: extractResponse.data.concepts,
        raw_text: parseResponse.data.raw_text,
      });

      // Navigate to ProcessingView for image generation
      onNavigate('processing');
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Make sure the backend is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasInput = file || text.trim();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            NotesViz
          </h1>
          <p className="text-lg text-gray-400">Paste your notes. See your ideas.</p>
          <p className="text-sm text-gray-500 mt-1">Upload PDF, images, or paste text to generate visual concept maps</p>
        </div>

        {/* Drag & Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
              : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
          } ${file ? 'border-green-500 bg-green-500/10' : ''}`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div>
              <svg className="mx-auto h-12 w-12 text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-400 font-medium text-lg">{file.name}</p>
              <p className="text-sm text-gray-400 mt-1">Click to change file</p>
            </div>
          ) : (
            <div>
              <svg className="mx-auto h-14 w-14 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop the file here' : 'Drag & drop your notes'}
              </p>
              <p className="text-sm text-gray-400 mt-2">PDF, JPG, PNG, TXT supported</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-900 text-gray-400">OR</span>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Paste your notes here..."
          className="w-full h-40 bg-gray-800 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
        />

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-700/50 text-red-200 px-4 py-3 rounded-xl text-sm">
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!hasInput || isLoading}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
            hasInput && !isLoading
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01]'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Extracting concepts...
            </span>
          ) : (
            '✨ Visualize My Notes'
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadView;