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
