import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import About from './pages/About'
import AINews from './pages/AINews'
import Auth from './pages/Auth'
import Coding from './pages/Coding'
import Contact from './pages/Contact'
import CreateTool from './pages/CreateTool'
import EditTool from './pages/EditTool'
import Home from './pages/Home'
import Internships from './pages/Internships'
import Privacy from './pages/Privacy'
import Profile from './pages/Profile'
import Terms from './pages/Terms'
import ToolDetail from './pages/ToolDetail'
import ToolsList from './pages/ToolsList'
import AdminImport from './pages/AdminImport'
import AdminReview from './pages/AdminReview'

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-site text-slate-900">
      <div className="site-orb site-orb-left" />
      <div className="site-orb site-orb-right" />
      <Header />
      <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 xl:px-8">
        <div className="page-enter">
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
            <Route path="/admin/import" element={<AdminImport />} />
            <Route path="/admin/review" element={<AdminReview />} />
          </Routes>
        </div>
      </main>
      {location.pathname === '/' && <Footer />}
    </div>
  )
}
