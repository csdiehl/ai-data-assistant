// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
let firebase_app = null

if (!getApps().length) {
  firebase_app = initializeApp(firebaseConfig)
}

const auth = getAuth(firebase_app)
const storage = getStorage(firebase_app)

// update the cors headers on storage to allow downloads from any domain
/*
const bucketName = "gs://ai-data-assistant-8a2c9.appspot.com"
async function configureBucketCors() {
  await storage.bucket(bucketName).setCorsConfiguration([
    {
      maxAgeSeconds: 3600,
      method: ["GET"],
      origin: ["*"],
    },
  ])

  console.log(`Bucket ${bucketName} was updated with a CORS config
      to allow ${method} requests from ${origin}`)
}

configureBucketCors().catch(console.error)
*/

export default firebase_app

export { firebase_app, auth, storage }
