import { auth } from "./config"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"

export const provider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider)
    return result
  } catch (error) {
    console.error("Error signing in with Google", error)
  }
}

export async function signOut() {
  try {
    return auth.signOut()
  } catch (error) {
    console.error("Error signing out with Google", error)
  }
}
