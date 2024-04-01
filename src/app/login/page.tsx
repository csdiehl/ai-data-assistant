"use client"

import { signInWithGoogle } from "@/firebase/useAuth"
import { useState, useEffect } from "react"
import styled from "styled-components"
import { User, onAuthStateChanged } from "firebase/auth"
import { auth } from "@/firebase/config"

const Login = styled.button`
  height: 48px;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
  color: black;
`

export default function Page() {
  const [user, setUser] = useState<User | null>(null)

  function signIn(e) {
    e.preventDefault()
    signInWithGoogle()
  }

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
      } else {
        console.log("no user")
      }
    })
  }, [])

  console.log(user)

  return (
    <form>
      <Login onClick={signIn} type="submit">
        Sign in with Google
      </Login>
    </form>
  )
}