"use client"

import { auth } from "@/firebase/config"
import { signInWithGoogle } from "@/firebase/useAuth"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect } from "react"
import styled from "styled-components"
import { useAuth } from "../context"
import { addData, getData } from "@/firebase/database"

const Login = styled.button`
  height: 48px;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
  color: black;
`

const Form = styled.form`
  h1 {
    color: grey;
    font-weight: lighter;
    text-align: center;
    margin: 16px 0;
  }
`

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  height: 100vh;
  width: 100%;
`

export default function Page() {
  const { setUser } = useAuth()
  const router = useRouter()

  function signIn(e: FormEvent) {
    e.preventDefault()
    signInWithGoogle()
  }

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // save the info in context for other page to access
        setUser(user)
        // check if the user already exists in the database
        getData("users", user.uid).then(({ result }) => {
          if (!result) {
            // add the user to the database if they don't exist there already
            addData("users", user.uid, {
              name: user.displayName,
              uid: user.uid,
              credits: 25,
            }).then(({ result, error }) => {
              if (error) console.log(error)
              return result
            })
          }
        })

        // redirect to the home page
        router.push("/")
      } else {
        router.push("/login")
        console.log("no user")
      }
    })
  }, [router, setUser])

  return (
    <Container>
      <Form>
        <h1>AI Data Explorer</h1>
        <Login onClick={signIn} type="submit">
          Sign in with Google
        </Login>
      </Form>
    </Container>
  )
}
