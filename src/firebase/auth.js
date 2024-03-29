import firebase_app from "./config"
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth"

const auth = getAuth(firebase_app)

export function onAuthStateChanged(cb) {
  return _onAuthStateChanged(auth, cb)
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()

  try {
    await signInWithPopup(auth, provider)
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
