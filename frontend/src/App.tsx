import { useState, useContext } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SessionContext } from './SessionContext'
import UploadView from './views/UploadView'
import ProcessingView from './views/ProcessingView'
import ConceptMapView from './views/ConceptMapView'
import HomeView from './views/HomeView'
import AboutView from './views/AboutView'
import Navbar from './views/Navbar'

type AppFlowView = 'upload' | 'processing' | 'results'
type Tab = 'home' | 'app' | 'about'

function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [appView, setAppView] = useState<AppFlowView>('upload')
  const { setSession } = useContext(SessionContext) as any

  const handleReset = () => {
    setAppView('upload')
    setSession(null)
  }

  // Define how the core "App" tab renders
  const renderAppTab = () => (
    <AnimatePresence mode="wait">
      {appView === 'upload' && (
        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
          <UploadView onNavigate={setAppView} />
        </motion.div>
      )}
      {appView === 'processing' && (
        <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
          <ProcessingView onNavigate={setAppView} />
        </motion.div>
      )}
      {appView === 'results' && (
        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
          <ConceptMapView onNavigate={setAppView} />
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 font-sans">
      <Navbar activeTab={tab} onTabChange={setTab} />
      
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tab === 'home' && (
          <motion.div key="home-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 bg-gray-900">
            <HomeView onNavigate={() => setTab('app')} />
          </motion.div>
        )}
        
        {tab === 'app' && (
          <motion.div key="app-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            {renderAppTab()}
          </motion.div>
        )}
        
        {tab === 'about' && (
          <motion.div key="about-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 bg-gray-900">
            <AboutView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
