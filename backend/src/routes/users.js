const express = require('express')
const router = express.Router()
const Tool = require('../models/Tool')
const User = require('../models/User')

function ensureAuth(req,res,next){
  if(req.isAuthenticated && req.isAuthenticated()) return next()
  return res.status(401).json({ error: 'unauthenticated' })
}

// Save favorite (simple example: attached to session user)
router.post('/favorites', ensureAuth, async (req,res)=>{
  try{
    const { slug } = req.body
    if(!slug) return res.status(400).json({ error: 'missing_slug' })
    const user = await User.findById(req.user.id)
    if(!user) return res.status(404).json({ error: 'user_not_found' })
    user.favorites = user.favorites || []
    if(!user.favorites.includes(slug)) user.favorites.push(slug)
    await user.save()
    res.json({ ok: true, favorite: slug })
  }catch(err){
    console.error(err)
    res.status(500).json({ error: 'server_error' })
  }
})

// GET favorites for current user
router.get('/favorites', ensureAuth, async (req,res)=>{
  try{
    const user = await User.findById(req.user.id).lean()
    if(!user) return res.status(404).json({ error: 'user_not_found' })
    res.json({ favorites: user.favorites || [] })
  }catch(err){ console.error(err); res.status(500).json({ error: 'server_error' }) }
})

// Public quick search helper
router.get('/search', async (req,res)=>{
  try{
    const q = req.query.q || ''
    const filter = q ? { $text: { $search: q } } : {}
    const tools = await Tool.find(filter).limit(50).lean()
    res.json({ tools })
  }catch(err){
    console.error(err)
    res.status(500).json({ error: 'server_error' })
  }
})

module.exports = router
