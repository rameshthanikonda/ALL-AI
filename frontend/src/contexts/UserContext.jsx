import React, { createContext, useContext, useEffect, useState } from 'react'
import { fetchCurrentUser } from '../services/api'

const UserContext = createContext(null)

export function UserProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refresh(){
    setLoading(true)
    try{
      const data = await fetchCurrentUser()
      setUser(data.user || null)
    }catch(e){ setUser(null) }
    setLoading(false)
  }

  useEffect(()=>{
    // Check if redirected back from Google OAuth
    const params = new URLSearchParams(window.location.search)
    if(params.has('authSuccess') || params.has('authError')){
      // Clean up the URL query params
      const url = new URL(window.location.href)
      url.searchParams.delete('authSuccess')
      url.searchParams.delete('authError')
      window.history.replaceState({}, '', url.pathname)
    }
    refresh()
  }, [])

  return (
    <UserContext.Provider value={{ user, loading, refresh }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(){ return useContext(UserContext) }

export default UserContext
