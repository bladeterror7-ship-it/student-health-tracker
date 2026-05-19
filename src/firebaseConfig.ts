import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB2HyLGONNdkaJtv_R63A7WQSRAgDbesWQ',
  authDomain: 'physical-246df.firebaseapp.com',
  projectId: 'physical-246df',
  storageBucket: 'physical-246df.firebasestorage.app',
  messagingSenderId: '1029871934071',
  appId: '1:1029871934071:web:94245beba24caac13d4472',
  measurementId: 'G-EM93EJ9ZEC',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
