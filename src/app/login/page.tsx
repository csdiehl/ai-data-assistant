"use client"

import { auth } from "@/firebase/config"
import { signInWithGoogle } from "@/firebase/useAuth"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import styled from "styled-components"
import { useAuth } from "../context"

const Login = styled.button`
  height: 48px;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
  color: black;
`

export default function Page() {
  const { setUser } = useAuth()
  const router = useRouter()

  function signIn(e) {
    e.preventDefault()
    signInWithGoogle()
  }

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
        router.push("/")
      } else {
        router.push("/login")
        console.log("no user")
      }
    })
  }, [router, setUser])

  return (
    <form>
      <Login onClick={signIn} type="submit">
        Sign in with Google
      </Login>
    </form>
  )
}
