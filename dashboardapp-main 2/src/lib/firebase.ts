import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Provided Firebase config (corrected storageBucket domain)
const firebaseConfig = {
  apiKey: 'AIzaSyDF7ecQu9Hv28cFfqVMIl-GGXYiPccriuE',
  authDomain: 'ai-sales-project-d88ff.firebaseapp.com',
  projectId: 'ai-sales-project-d88ff',
  storageBucket: 'ai-sales-project-d88ff.appspot.com',
  messagingSenderId: '1096979912603',
  appId: '1:1096979912603:web:0d9c31a76ee0cdc162f33e',
  measurementId: 'G-J7WYH28C3C',
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
// Use long polling to avoid "client is offline" in restricted networks/ad-blockers
export const db = initializeFirestore(app, { experimentalForceLongPolling: true })
export const storage = getStorage(app)

export const googleProvider = new GoogleAuthProvider()
// Microsoft / Outlook
export const microsoftProvider = new OAuthProvider('microsoft.com')
