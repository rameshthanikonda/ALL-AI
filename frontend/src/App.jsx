import React, { Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import Toast from './components/Toast'
import { useUser } from './contexts/UserContext'

// Lazy-load every route page so the initial bundle stays small
// and each page is fetched only when the user navigates to it.
const Home = React.lazy(() => import('./pages/Home'))
const ToolsList = React.lazy(() => import('./pages/ToolsList'))
const ToolDetail = React.lazy(() => import('./pages/ToolDetail'))
const EditTool = React.lazy(() => import('./pages/EditTool'))
const CreateTool = React.lazy(() => import('./pages/CreateTool'))
const Internships = React.lazy(() => import('./pages/Internships'))
const Coding = React.lazy(() => import('./pages/Coding'))
const AINews = React.lazy(() => import('./pages/AINews'))
const Auth = React.lazy(() => import('./pages/Auth'))
const Profile = React.lazy(() => import('./pages/Profile'))
const About = React.lazy(() => import('./pages/About'))
const Contact = React.lazy(() => import('./pages/Contact'))
const Privacy = React.lazy(() => import('./pages/Privacy'))
const Terms = React.lazy(() => import('./pages/Terms'))
const Disclaimer = React.lazy(() => import('./pages/Disclaimer'))
const AdminImport = React.lazy(() => import('./pages/AdminImport'))
const AdminReview = React.lazy(() => import('./pages/AdminReview'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <span className="text-sm font-medium text-slate-500">Loading...</span>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const { refresh } = useUser() || {}
  const [showToast, setShowToast] = React.useState(false)

  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('authSuccess') === '1') {
      // Re-fetch user session so the header updates immediately
      if (refresh) refresh()
      setShowToast(true)
      // Clean up the URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [location, refresh])

  return (
    <div className="min-h-screen bg-site text-slate-900">
      <div className="site-orb site-orb-left" />
      <div className="site-orb site-orb-right" />
      <Header />
      <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 xl:px-8">
        <div className="page-enter">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tools" element={<ToolsList />} />
              <Route path="/tools/:slug" element={<ToolDetail />} />
              <Route path="/tools/:slug/edit" element={<EditTool />} />
              <Route path="/tools/new" element={<CreateTool />} />
              <Route path="/internships" element={<Internships />} />
              <Route path="/coding" element={<Coding />} />
              <Route path="/news" element={<AINews />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/admin/import" element={<AdminImport />} />
              <Route path="/admin/review" element={<AdminReview />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      {location.pathname === '/' && <Footer />}
      {showToast && <Toast message="Successfully logged in!" onClose={() => setShowToast(false)} />}
    </div>
  )
}
