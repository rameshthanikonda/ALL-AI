const express = require('express')
const router = express.Router()
const Tool = require('../models/Tool')

router.get('/sitemap.xml', async (req,res)=>{
  try{
    const tools = await Tool.find({}).select('slug createdAt').lean()
    res.header('Content-Type','application/xml')
    const base = process.env.FRONTEND_URL || 'http://localhost:5173'
    const urls = tools.map(t => `  <url>\n    <loc>${base}/tools/${t.slug}</loc>\n    <lastmod>${(t.createdAt||new Date()).toISOString()}</lastmod>\n  </url>`).join('\n')
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${base}</loc>\n  </url>\n${urls}\n</urlset>`
    res.send(xml)
  }catch(err){
    console.error(err)
    res.status(500).send('server_error')
  }
})

router.get('/robots.txt', (req,res)=>{
  const base = process.env.FRONTEND_URL || 'http://localhost:5173'
  res.type('text/plain')
  res.send(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml`)
})

module.exports = router
