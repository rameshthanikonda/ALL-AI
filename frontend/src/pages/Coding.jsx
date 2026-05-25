import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useUser } from '../contexts/UserContext'

const platformLinks = [
  { name: 'LeetCode', url: 'https://leetcode.com', focus: 'Company-style problem practice, tagged topics, and interview pacing.' },
  { name: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org', focus: 'Topic explanations, company articles, and revision content.' },
  { name: 'HackerRank', url: 'https://www.hackerrank.com', focus: 'Assessments, SQL, and interview-style problem solving.' },
  { name: 'Codeforces', url: 'https://codeforces.com', focus: 'Contests, difficulty-based practice, and strong problem archives.' },
  { name: 'CodeChef', url: 'https://www.codechef.com', focus: 'Contest progression and DSA improvement.' },
  { name: 'HackerEarth', url: 'https://www.hackerearth.com', focus: 'Hiring challenges and OA-style questions.' },
  { name: 'InterviewBit', url: 'https://www.interviewbit.com', focus: 'Structured preparation paths and curated interview tracks.' },
  { name: 'Take U Forward', url: 'https://takeuforward.org/', focus: 'Strong structured sheets, roadmaps, and DSA preparation flow.' },
]

const setupLinks = [
  {
    name: 'Install Ollama',
    url: 'https://ollama.com/download',
    detail: 'Run local models on your machine for offline experimentation and lightweight AI workflows.',
  },
  {
    name: 'Set Up Claude Code',
    url: 'https://docs.claude.com/en/docs/claude-code/setup',
    detail: 'Official setup guide for Claude Code inside your development workflow.',
  },
  {
    name: 'Claude Code Overview',
    url: 'https://code.claude.com/docs',
    detail: 'Product overview, install paths, and developer workflow references in one place.',
  },
  {
    name: 'Open WebUI',
    url: 'https://openwebui.com/',
    detail: 'A helpful local interface if you want a more visual setup alongside Ollama.',
  },
]

const serviceCompanyTracks = [
  {
    company: 'Infosys',
    offer: 'Mass hiring plus specialist digital roles',
    focus: 'aptitude, strings, arrays, SQL, CS basics, communication',
    style: 'Best for students targeting structured campus-style preparation with strong fundamentals.',
    starterQuestions: ['Two Sum', 'Palindrome Check', 'Find Missing Number'],
    careersUrl: 'https://www.infosys.com/careers.html',
  },
  {
    company: 'TCS',
    offer: 'High-volume entry hiring and OA-led filtering',
    focus: 'aptitude, verbal reasoning, arrays, coding speed, fundamentals',
    style: 'Prepare for online assessments, consistency, and clean implementation.',
    starterQuestions: ['Linear Search Variants', 'Kadane Algorithm', 'Valid Parentheses'],
    careersUrl: 'https://www.tcs.com/careers',
  },
  {
    company: 'Cognizant',
    offer: 'Entry-level engineering and digital roles',
    focus: 'arrays, strings, SQL, debugging, problem-solving basics',
    style: 'A practical lane for students aiming at service-company interviews.',
    starterQuestions: ['Anagram Check', 'Longest Common Prefix', 'Merge Sorted Arrays'],
    careersUrl: 'https://careers.cognizant.com/us-en/',
  },
  {
    company: 'Accenture',
    offer: 'Consulting-tech roles with coding and communication mix',
    focus: 'aptitude, DSA basics, pseudo-code logic, SQL, communication',
    style: 'Useful for students who want broad tech roles with balanced assessment patterns.',
    starterQuestions: ['Reverse String', 'Second Largest Element', 'Count Vowels in String'],
    careersUrl: 'https://www.accenture.com/us-en/careers',
  },
  {
    company: 'Deloitte',
    offer: 'Consulting and engineering tracks with mixed assessment rounds',
    focus: 'aptitude, SQL, coding basics, communication, problem solving',
    style: 'Good for students who want a blend of tech and consulting-oriented hiring.',
    starterQuestions: ['Binary Search', 'String Compression', 'Find Duplicates'],
    careersUrl: 'https://www2.deloitte.com/global/en/careers.html',
  },
  {
    company: 'Capgemini',
    offer: 'Entry-level engineering and digital transformation roles',
    focus: 'aptitude, reasoning, arrays, OOP basics, implementation speed',
    style: 'Good fit for students targeting service-company engineering roles.',
    starterQuestions: ['Rotate Array', 'Fibonacci DP', 'Balanced Parentheses'],
    careersUrl: 'https://www.capgemini.com/careers/',
  },
]

const productCompanyTracks = [
  {
    company: 'Google',
    offer: 'High-growth SWE and intern pathways',
    focus: 'graphs, trees, binary search, DP, clean reasoning',
    style: 'Strong algorithmic depth with crisp explanation and edge-case clarity.',
    starterQuestions: ['Number of Islands', 'Binary Tree Maximum Path Sum', 'Word Ladder'],
    careersUrl: 'https://www.google.com/about/careers/applications/jobs/results',
  },
  {
    company: 'Amazon',
    offer: 'Large intern, new grad, and OA-heavy hiring lanes',
    focus: 'arrays, strings, heaps, sliding window, BFS, OA patterns',
    style: 'Speed matters a lot. Practice timed OA-style coding and fast debugging.',
    starterQuestions: ['Top K Frequent Elements', 'Rotting Oranges', 'Longest Substring Without Repeating Characters'],
    careersUrl: 'https://www.amazon.jobs/en',
  },
  {
    company: 'Microsoft',
    offer: 'Strong intern and student program pipeline',
    focus: 'linked lists, trees, recursion, system basics',
    style: 'Balanced coding plus clear communication and CS fundamentals.',
    starterQuestions: ['Reverse Linked List', 'Lowest Common Ancestor of a Binary Tree', 'LRU Cache'],
    careersUrl: 'https://careers.microsoft.com/v2/global/en/programs/students.html',
  },
  {
    company: 'Meta',
    offer: 'Competitive product-engineering coding rounds',
    focus: 'arrays, graphs, BFS/DFS, intervals, product thinking',
    style: 'Fast coding rounds with emphasis on correctness and tradeoff discussion.',
    starterQuestions: ['Merge Intervals', 'Course Schedule', 'Clone Graph'],
    careersUrl: 'https://www.metacareers.com/',
  },
  {
    company: 'Adobe',
    offer: 'Well-regarded internship and university programs',
    focus: 'DP, trees, backtracking, OOP, optimization',
    style: 'Classic interview patterns with emphasis on structured reasoning.',
    starterQuestions: ['Subset Sum', 'Path Sum II', 'Longest Increasing Subsequence'],
    careersUrl: 'https://careers.adobe.com/us/en/university',
  },
  {
    company: 'Atlassian',
    offer: 'Early-career roles with strong engineering culture',
    focus: 'clean backend logic, APIs, data structures, practical coding',
    style: 'Engineering-friendly rounds with readability and maintainability in focus.',
    starterQuestions: ['Design Hit Counter', 'Group Anagrams', 'K Closest Points to Origin'],
    careersUrl: 'https://www.atlassian.com/company/careers/earlycareers',
  },
  {
    company: 'Uber',
    offer: 'Strong engineering and systems-oriented coding interviews',
    focus: 'graphs, shortest path, hash maps, optimization, system basics',
    style: 'A good target for students who like practical algorithmic problem solving.',
    starterQuestions: ['Network Delay Time', 'Accounts Merge', 'Meeting Rooms II'],
    careersUrl: 'https://www.uber.com/us/en/careers/',
  },
  {
    company: 'Walmart Global Tech',
    offer: 'Large-scale engineering roles with backend and systems depth',
    focus: 'arrays, trees, system basics, backend logic, optimization',
    style: 'Good fit for students interested in large-scale product engineering.',
    starterQuestions: ['Level Order Traversal', 'Kth Largest Element', 'LRU Cache'],
    careersUrl: 'https://careers.walmart.com/technology',
  },
  {
    company: 'Samsung',
    offer: 'Product engineering and device/software roles',
    focus: 'C++, Java, algorithms, implementation detail, CS fundamentals',
    style: 'Useful for students who want product engineering with strong fundamentals.',
    starterQuestions: ['Implement Trie', 'Longest Common Subsequence', 'Flood Fill'],
    careersUrl: 'https://www.samsung.com/us/careers/',
  },
  {
    company: 'Swiggy',
    offer: 'Fast-moving product and backend engineering opportunities',
    focus: 'backend logic, APIs, hashing, queues, product thinking',
    style: 'Great for students who want startup-style product engineering preparation.',
    starterQuestions: ['Design Parking System', 'Sliding Window Maximum', 'Top K Frequent Words'],
    careersUrl: 'https://careers.swiggy.com/',
  },
  {
    company: 'Zomato',
    offer: 'Consumer-product engineering and growth-focused roles',
    focus: 'arrays, strings, system thinking, practical debugging, APIs',
    style: 'Good for students who enjoy product-centric problem solving.',
    starterQuestions: ['Group Anagrams', 'Product of Array Except Self', 'Design Browser History'],
    careersUrl: 'https://www.zomato.com/careers',
  },
]

const quantCompanyTracks = [
  {
    company: 'Graviton',
    offer: 'Quant and trading-tech opportunities',
    focus: 'probability, combinatorics, fast math, optimization, C++/Python',
    style: 'Best for students who enjoy fast reasoning, math-heavy challenges, and competitive problem solving.',
    careersUrl: 'https://www.gravitontrading.com/careers.html',
  },
  {
    company: 'Jane Street',
    offer: 'Deep problem-solving and quant pathways',
    focus: 'math puzzles, probability, algorithms, systems depth',
    style: 'A strong fit for puzzle-heavy thinkers who like clean logic and unusual interview questions.',
    careersUrl: 'https://www.janestreet.com/join-jane-street/',
  },
  {
    company: 'Tower Research',
    offer: 'High-performance systems and quant engineering roles',
    focus: 'low-latency systems, algorithms, performance engineering, math',
    style: 'Great for students interested in serious systems work and performance-focused coding.',
    careersUrl: 'https://tower-research.com/careers/',
  },
  {
    company: 'IMC Trading',
    offer: 'Trading, quant, and technology internships',
    focus: 'probability, data reasoning, performance coding, trading-tech thinking',
    style: 'A good quant lane for students who want both software depth and trading exposure.',
    careersUrl: 'https://www.imc.com/us/careers/',
  },
  {
    company: 'Optiver',
    offer: 'Quant, research, and technology pathways',
    focus: 'mental math, probability, algorithms, fast decision-making',
    style: 'Well suited to students preparing for quant-style interviews and fast reasoning rounds.',
    careersUrl: 'https://optiver.com/working-at-optiver/career-opportunities/7631218002/',
  },
]

function CompanyTrackSection({ title, subtitle, items }) {
  return (
    <section className="space-y-4">
      <div>
        <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">{subtitle}</div>
        <h2 className="font-display mt-2 text-3xl text-slate-900">{title}</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((track) => (
          <article key={track.company} className="section-shell p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500">
                {track.company}
              </span>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {track.offer}
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-slate-900">{track.company} coding track</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Focus on {track.focus}. {track.style}
            </p>
            <div className="mt-5">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Starter Questions</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {track.starterQuestions.map((question) => (
                  <span key={question} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                    {question}
                  </span>
                ))}
              </div>
            </div>
            <a href={track.careersUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-sm font-semibold text-blue-600">
              Open careers page
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function Coding() {
  const { user } = useUser() || {}
  const navigate = useNavigate()

  useEffect(() => {
    if (user) return
    window.alert('Please login to access Coding.')
    navigate('/auth')
  }, [navigate, user])

  if (!user) return null

  return (
    <div className="space-y-8">
      <section className="hero-panel overflow-hidden rounded-[2rem] border border-slate-900/80 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 px-8 py-12 text-white shadow-xl lg:px-12">
        <div className="max-w-5xl">
          <div className="text-sm font-medium uppercase tracking-[0.22em] text-blue-200">Coding System</div>
          <h1 className="font-display mt-4 text-5xl leading-tight text-white sm:text-6xl">
            Coding preparation organized by company, offers, and clearer career paths.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            This section now focuses on companies, prep direction, and useful coding resources instead of showing a weak placeholder feed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/tools" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100">
              Explore tools
            </Link>
            <Link to="/internships" className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20">
              Open internships
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Coding Platforms</div>
          <h2 className="font-display mt-2 text-3xl text-slate-900">Direct links to strong prep platforms.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {platformLinks.map((platform) => (
            <a key={platform.name} href={platform.url} target="_blank" rel="noreferrer" className="section-shell p-5 transition hover:-translate-y-0.5">
              <div className="text-lg font-semibold text-slate-900">{platform.name}</div>
              <div className="mt-3 text-sm leading-7 text-slate-600">{platform.focus}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Builder Setup</div>
          <h2 className="font-display mt-2 text-3xl text-slate-900">Useful tools to install for an AI-powered coding workflow.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {setupLinks.map((tool) => (
            <a key={tool.name} href={tool.url} target="_blank" rel="noreferrer" className="section-shell p-5 transition hover:-translate-y-0.5">
              <div className="text-lg font-semibold text-slate-900">{tool.name}</div>
              <div className="mt-3 text-sm leading-7 text-slate-600">{tool.detail}</div>
            </a>
          ))}
        </div>
      </section>

      <CompanyTrackSection
        title="Service and Enterprise Tracks"
        subtitle="Broader company coverage for common student targets, including Deloitte"
        items={serviceCompanyTracks}
      />

      <CompanyTrackSection
        title="Product and Startup-Style Tracks"
        subtitle="More company lanes for interesting engineering targets"
        items={productCompanyTracks}
      />

      <section className="space-y-4">
        <div>
          <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Quant and Trading Tracks</div>
          <h2 className="font-display mt-2 text-3xl text-slate-900">Quant and trading companies to explore with a clearer prep direction.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {quantCompanyTracks.map((track) => (
            <a key={track.company} href={track.careersUrl} target="_blank" rel="noreferrer" className="section-shell p-5 transition hover:-translate-y-0.5">
              <div className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                {track.offer}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900">{track.company}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Focus on {track.focus}. {track.style}
              </p>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
