"use client"

import { User } from "firebase/auth"
import { createContext, useState, useContext } from "react"

interface Context {
  user: User | null
  setUser: any
}

const AuthContext = createContext<Context>({ user: null, setUser: null })

const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null)
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}

export default AuthProvider
