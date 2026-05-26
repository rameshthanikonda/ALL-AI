const express = require('express')
const router = express.Router()
const passport = require('passport')
const User = require('../models/User')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

let googleConfigured = false
try{
  const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
  if(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET){
    const backendBaseUrl =
      process.env.BACKEND_URL ||
      `http://localhost:${process.env.PORT || 4000}`

    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || new URL('/auth/google/callback', backendBaseUrl).toString()
    }, async (accessToken, refreshToken, profile, done)=>{
      try{
        let user = await User.findOne({ googleId: profile.id })
        if(!user){
          user = await User.create({ googleId: profile.id, email: profile.emails?.[0]?.value, displayName: profile.displayName })
        }
        return done(null, user)
      }catch(err){
        return done(err)
      }
    }))
    googleConfigured = true
    console.log('Google OAuth configured')
  }else{
    console.warn('Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable')
  }
}catch(e){
  console.warn('passport-google-oauth20 not installed or failed to load', e.message)
}

passport.serializeUser((user, done)=> done(null, user.id))
passport.deserializeUser(async (id, done)=>{
  try{ const u = await User.findById(id); done(null, u) }catch(e){ done(e) }
})

// Local strategy (email + password)
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done)=>{
  try{
    const user = await User.findOne({ email })
    if(!user || !user.passwordHash) return done(null, false, { message: 'invalid_credentials' })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if(!ok) return done(null, false, { message: 'invalid_credentials' })
    return done(null, user)
  }catch(err){
    return done(err)
  }
}))

// Register endpoint
router.post('/register', async (req,res)=>{
  try{
    const { email, password, displayName } = req.body
    if(!email || !password) return res.status(400).json({ error: 'missing_fields' })
    let existing = await User.findOne({ email })
    if(existing) return res.status(409).json({ error: 'email_exists' })
    const hash = await bcrypt.hash(password, 12)
    const user = await User.create({ email, displayName, passwordHash: hash })
    req.login(user, err=>{ if(err) console.error(err) })
    res.json({ ok: true, user: { id: user.id, email: user.email, displayName: user.displayName } })
  }catch(err){ console.error(err); res.status(500).json({ error: 'server_error' }) }
})

// Login endpoint (local)
router.post('/login', passport.authenticate('local'), (req,res)=>{
  res.json({ ok: true, user: { id: req.user.id, email: req.user.email, displayName: req.user.displayName } })
})

// Redirect to Google (only if configured)
if(googleConfigured){
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
  router.get('/google/callback', (req,res,next)=>{
    passport.authenticate('google', (err, user, info)=>{
      const frontend = process.env.FRONTEND_URL || 'http://localhost:5173'
      if(err){
        try{
          const util = require('util')
          console.error('Google callback error (detailed):', util.inspect(err, { depth: 4 }))
        }catch(e){
          console.error('Google callback error:', err)
        }
        return res.redirect(`${frontend}/?authError=server`)
      }
      if(!user){
        console.warn('Google callback: no user returned', info)
        return res.redirect(`${frontend}/?authError=no_user`)
      }
      req.login(user, (loginErr)=>{
        if(loginErr){
          console.error('Login after Google failed:', loginErr)
          return res.redirect(`${frontend}/?authError=login_failed`)
        }
        // success
        return res.redirect(`${frontend}/?authSuccess=1`)
      })
    })(req,res,next)
  })
} else {
  router.get('/google', (req,res)=> res.status(501).json({ error: 'google_not_configured' }))
  router.get('/google/callback', (req,res)=> res.status(501).json({ error: 'google_not_configured' }))
}

// Simple logout
router.post('/logout', (req,res)=>{
  req.logout(()=>{})
  res.json({ ok: true })
})

// GET /auth/me - return current user session
router.get('/me', (req,res)=>{
  if(req.isAuthenticated && req.isAuthenticated()){
    const u = req.user
    return res.json({ user: { id: u.id, email: u.email, displayName: u.displayName } })
  }
  res.json({ user: null })
})

module.exports = router
