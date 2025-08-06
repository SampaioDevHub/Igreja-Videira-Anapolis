import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCRWc-v0FRmWqQxtCdDOfjP6bzxuRfTGaM",
  authDomain: "igrejavideira-d4c17.firebaseapp.com",
  projectId: "igrejavideira-d4c17",
  storageBucket: "igrejavideira-d4c17.firebasestorage.app",
  messagingSenderId: "757629213152",
  appId: "1:757629213152:web:95e08fa7e16db77db5f385",
}

class FirebaseService {
  private static instance: FirebaseService
  private app: FirebaseApp | null = null
  private auth: Auth | null = null
  private db: Firestore | null = null
  private initialized = false

  private constructor() {}

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService()
    }
    return FirebaseService.instance
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log("Firebase already initialized")
      return
    }

    try {

      if (getApps().length === 0) {
        this.app = initializeApp(firebaseConfig)
        console.log("Firebase app created")
      } else {
        this.app = getApps()[0]
        console.log("Using existing Firebase app")
      }

      await new Promise((resolve) => setTimeout(resolve, 100))


      this.auth = getAuth(this.app)
      console.log("Firebase Auth initialized")


      this.db = getFirestore(this.app)
      console.log("Firebase Firestore initialized")

      this.initialized = true
      console.log("Firebase initialization completed successfully")
    } catch (error) {
      console.error("Firebase initialization error:", error)
      throw new Error(`Failed to initialize Firebase: ${error}`)
    }
  }

  public getAuth(): Auth {
    if (!this.auth) {
      throw new Error("Firebase Auth not initialized. Call initialize() first.")
    }
    return this.auth
  }

  public getFirestore(): Firestore {
    if (!this.db) {
      throw new Error("Firebase Firestore not initialized. Call initialize() first.")
    }
    return this.db
  }

  public getApp(): FirebaseApp {
    if (!this.app) {
      throw new Error("Firebase App not initialized. Call initialize() first.")
    }
    return this.app
  }

  public isInitialized(): boolean {
    return this.initialized
  }
}


export const firebaseService = FirebaseService.getInstance()

export const getAuthInstance = () => firebaseService.getAuth()
export const getFirestoreInstance = () => firebaseService.getFirestore()
export const getAppInstance = () => firebaseService.getApp()
