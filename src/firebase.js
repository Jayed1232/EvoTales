import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBjDvCoipumFfn8C8boQecbIxMxktLtQ1E",
  authDomain: "inkwell-dc6fe.firebaseapp.com",
  projectId: "inkwell-dc6fe",
  storageBucket: "inkwell-dc6fe.firebasestorage.app",
  messagingSenderId: "404056573784",
  appId: "1:404056573784:web:20798e875a0597e110872d",
  measurementId: "G-TQJNKK3K0G"
}

let app, db, auth

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
  signInAnonymously(auth).catch(() => {})
} catch (e) {
  console.warn('Firebase init failed:', e)
}

export { db, auth }
