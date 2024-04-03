import firebase_app from "./config"
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore"

const db = getFirestore(firebase_app)

// add data to the firestore
export async function addData(collection, id, data) {
  let result = null
  let error = null

  try {
    result = await setDoc(doc(db, collection, id), data, {
      merge: true,
    })
  } catch (e) {
    error = e
  }

  return { result, error }
}

// get data from the firestore
export async function getData(collection, id) {
  let docRef = doc(db, collection, id)

  let result = null
  let error = null

  try {
    result = await getDoc(docRef)
  } catch (e) {
    error = e
  }

  return { result, error }
}

// decrement user's allowed credits on every generation
export async function updateCredits(userId) {
  const docRef = doc(db, "users", userId)

  const count = (await getDoc(docRef)).data().credits

  await updateDoc(docRef, {
    credits: count - 1,
  })
}

export async function getCredits(userId) {
  const docRef = doc(db, "users", userId)
  const result = await getDoc(docRef)

  return result.data().credits
}
