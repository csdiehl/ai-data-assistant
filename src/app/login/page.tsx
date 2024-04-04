"use client"

import { auth } from "@/firebase/config"
import { signInWithGoogle } from "@/firebase/useAuth"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect } from "react"
import styled from "styled-components"
import { useAuth } from "../context"
import { addData, getData } from "@/firebase/database"
import { primary } from "@/components/settings"

const Login = styled.button`
  height: 48px;
  border-radius: 8px;
  border: none;
  background: ${primary};
  padding: 8px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    filter: brightness(0.8);
  }
`

const Form = styled.form`
  max-width: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;

  h1,
  h2 {
    text-align: center;
  }

  h1 {
    font-weight: 300;
    color: ${primary};
  }

  h2 {
    font-weight: lighter;
    color: grey;
  }

  p {
    color: grey;
    font-weight: medium;
    font-size: 0.875rem;
  }
  a {
    color: ${primary};
  }
`

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #f5f5f5;
  min-height: 100vh;
  width: 100%;

  img {
    box-shadow: 0 0 10px grey;
    border-radius: 8px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 24px;

    img {
      width: 80%;
    }
  }
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
      <img
        alt="a chart generated with this AI tool"
        width="500px"
        src="/hero.png"
      ></img>
      <Form>
        <h1>AI Data Explorer</h1>
        <h2>
          Chat with your data and make visualizations, with the help of an LLM
        </h2>
        <Login onClick={signIn} type="submit">
          Sign in with Google
        </Login>
        <p>
          Note: This app is a demo and solo developer project, and development
          is in progress. You will likely encounter bugs. Known issues are
          visualizing some time series data, and certain files with unescaped
          characters. To report an issue or submit a PR,{" "}
          <a
            rel="noreferrer"
            target="_blank"
            href="https://github.com/csdiehl/ai-data-assistant"
          >
            see here.
          </a>
        </p>
      </Form>
    </Container>
  )
}
