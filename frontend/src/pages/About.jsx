import React from 'react'
import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      <section className="section-shell hero-panel p-8 md:p-12">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">About Us</div>
        <h1 className="font-display mt-4 text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Empowering Students to Lead in the AI Era
        </h1>
        <p className="mt-4 text-sm sm:text-base leading-7 text-slate-600 max-w-3xl">
          Welcome to <strong>Student AI Tools</strong>, the premier discovery and resource portal tailored specifically for academic excellence and professional growth. We curate the most effective artificial intelligence tools, list high-impact tech internships, supply critical coding challenges, and report the latest in AI innovation.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: 'Rigorous Curation',
            description: 'We test and verify every tool listed in our database. We discard low-quality clones to focus exclusively on products that save students time, accelerate learning, and raise academic output.',
            icon: '🎯'
          },
          {
            title: 'Search-First Speed',
            description: 'Students are busy. Our application features hybrid search across your local tool index, with AI directory discovery from curated sources when nothing matches locally.',
            icon: '⚡'
          },
          {
            title: 'All-in-One Resource',
            description: 'Beyond directory listings, we connect your studies to real-world opportunities by linking industry internship updates, expert interview prep challenges, and automated news.',
            icon: '🌐'
          }
        ].map((item) => (
          <div key={item.title} className="section-shell p-6 space-y-3 hover:shadow-md transition-shadow">
            <div className="text-3xl">{item.icon}</div>
            <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
            <p className="text-sm leading-6 text-slate-600">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="section-shell p-8 md:p-12 space-y-6">
        <h2 className="font-display text-3xl font-extrabold text-slate-900">Why This Directory Exists</h2>
        <p className="text-sm sm:text-base leading-7 text-slate-600">
          The emergence of generative AI represents a monumental shift in education and career building. However, with thousands of new tools launching monthly, finding a reliable, secure, and genuinely useful platform can feel like finding a needle in a haystack. 
        </p>
        <p className="text-sm sm:text-base leading-7 text-slate-600">
          We built Student AI Tools to bridge the gap between student workflows and cutting-edge software. Whether you need to draft an essay, analyze a complex dataset, debug a piece of code, optimize an academic paper, summarize a 100-page PDF, or explore creative design frameworks, our platform serves as your intuitive starting point.
        </p>
      </section>

      <section className="section-shell p-8 md:p-12 space-y-6 bg-gradient-to-br from-white via-sky-50 to-blue-50">
        <h2 className="font-display text-3xl font-extrabold text-slate-900">Our Four Core Pillars</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-base font-bold text-sky-800">1. Clean AI Directory</h4>
            <p className="text-sm text-slate-600 leading-6">
              Our curated search catalogs features, category lists, tags, and direct links without messy ads, paywalls, or misleading promotional listings. You see the best tools first.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-base font-bold text-sky-800">2. Internship Tracking</h4>
            <p className="text-sm text-slate-600 leading-6">
              Skip standard board scrolling. We offer real-time internship automation tracking, making it effortless to discover software engineering, design, and AI internships.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-base font-bold text-sky-800">3. Technical Coding Practice</h4>
            <p className="text-sm text-slate-600 leading-6">
              A comprehensive coding environment packed with data structures, algorithms, and logical problems designed to help you ace software engineering technical interviews.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-base font-bold text-sky-800">4. Live AI News Portal</h4>
            <p className="text-sm text-slate-600 leading-6">
              Stay ahead of the curve. Our platform automatically retrieves and synthesizes emerging AI news stories, keeping you up-to-date with shifts in the tech ecosystem.
            </p>
          </div>
        </div>
      </section>

      <section className="section-shell p-8 md:p-12 space-y-6">
        <h2 className="font-display text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
        <div className="space-y-4 divide-y divide-slate-100">
          <div className="pt-4 space-y-2">
            <h4 className="text-base font-bold text-slate-900">How do you decide which AI tools are listed?</h4>
            <p className="text-sm text-slate-600 leading-6">
              Every tool undergoes a verification check. We analyze user reviews, security standards, pricing plans (prioritizing free and student-discount options), and actual utility. If a tool doesn't add immediate value, it is not listed.
            </p>
          </div>
          <div className="pt-4 space-y-2">
            <h4 className="text-base font-bold text-slate-900">Can students submit new AI tools to the catalog?</h4>
            <p className="text-sm text-slate-600 leading-6">
              Absolutely! In fact, we encourage it. By signing in, you gain access to our custom creation portal where you can submit a tool, write its summary, assign relevant tags, and help keep the list growing.
            </p>
          </div>
          <div className="pt-4 space-y-2">
            <h4 className="text-base font-bold text-slate-900">Is it free to use this directory?</h4>
            <p className="text-sm text-slate-600 leading-6">
              Yes, Student AI Tools is 100% free to use. We do not charge subscriptions, nor do we hide directories behind premium paywalls. Our mission is to keep student resources open and accessible to all.
            </p>
          </div>
        </div>
        <div className="pt-6 flex justify-center">
          <Link
            to="/tools"
            className="rounded-full bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:-translate-y-0.5 hover:bg-blue-700 transition"
          >
            Explore Curated Tools Directory
          </Link>
        </div>
      </section>
    </div>
  )
}
