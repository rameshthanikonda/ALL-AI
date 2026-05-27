const CATEGORY_RULES = [
  {
    category: 'Coding',
    keywords: ['code', 'coding', 'developer', 'programming', 'dsa', 'github', 'editor', 'debugger', 'autocomplete', 'compile', 'javascript', 'python', 'git']
  },
  {
    category: 'Research',
    keywords: ['research', 'citation', 'paper', 'literature', 'academic', 'zotero', 'pdf reader', 'elicit', 'science', 'journals', 'sources']
  },
  {
    category: 'Writing',
    keywords: ['write', 'writing', 'essay', 'grammar', 'quillbot', 'paraphrase', 'plagiarism', 'proofread', 'editing', 'drafting', 'sentence']
  },
  {
    category: 'Presentations',
    keywords: ['presentation', 'slide', 'deck', 'slideshow', 'beautiful.ai', 'gamma', 'tome']
  },
  {
    category: 'Design',
    keywords: ['design', 'image', 'generation', 'art', 'graphic', 'poster', 'logo', 'canva', 'midjourney', 'leonardo', 'stable diffusion', 'drawing', 'illustration']
  },
  {
    category: 'Video Editing',
    keywords: ['video', 'clip', 'editing', 'avatar', 'trim', 'captions', 'reels', 'shorts', 'subtitle', 'movie']
  },
  {
    category: 'Notes',
    keywords: ['note', 'transcribe', 'transcription', 'lecture', 'audio notes', 'notebook', 'meeting notes', 'voice recorder']
  },
  {
    category: 'Productivity',
    keywords: ['productivity', 'tasks', 'calendar', 'automation', 'planner', 'schedule', 'reminder', 'workflows', 'organize', 'notion', 'collaboration']
  },
  {
    category: 'STEM',
    keywords: ['math', 'science', 'formula', 'physics', 'chemistry', 'biology', 'calculus', 'equations', 'wolfram']
  },
  {
    category: 'Study Assistant',
    keywords: ['assistant', 'tutoring', 'chatgpt', 'claude', 'gemini', 'homework', 'learning helper', 'explain', 'study helper']
  }
]

function categorizeTool(name = '', description = '', tags = []) {
  const content = `${name} ${description} ${tags.join(' ')}`.toLowerCase()

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (content.includes(keyword)) {
        return rule.category
      }
    }
  }

  return 'Productivity' // Default fallback category
}

module.exports = {
  categorizeTool,
  categories: CATEGORY_RULES.map(r => r.category)
}
