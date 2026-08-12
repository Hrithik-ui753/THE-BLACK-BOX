import type { User } from '@/types'
import { uid } from '@/utils/id'
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth, googleProvider } from './firebaseConfig'

export interface GoogleAuthOptions {
  email?: string
  name?: string
  photoURL?: string
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

class AuthService {
  async signInWithGoogle(options?: GoogleAuthOptions): Promise<User> {
    // If options are explicitly passed (e.g. from Google Account Chooser Modal), use them directly!
    if (options && options.email) {
      const email = options.email
      const rawName = options.name || (email.includes('@') ? email.split('@')[0].replace('.', ' ') : 'Google User')
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
      return {
        id: uid('google-user'),
        name: formattedName,
        email: email,
        phone: '+91 98765 43210',
        photoURL: options.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=4285F4&color=fff`,
      }
    }

    try {
      // Attempt Firebase Google Sign-In via popup
      const userCredential = await signInWithPopup(auth, googleProvider)
      const firebaseUser = userCredential.user
      const idToken = await firebaseUser.getIdToken()

      // Send ID Token to Backend for verification
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/verify-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            return {
              id: data.user.id || firebaseUser.uid,
              name: data.user.name || firebaseUser.displayName || 'Google User',
              email: data.user.email || firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '+91 98765 43210',
              photoURL: data.user.photoURL || firebaseUser.photoURL || undefined,
            }
          }
        }
      } catch (backendError) {
        console.warn('[AuthService] Backend verification unreached:', backendError)
      }

      // Return authenticated user details directly from Firebase token credential
      const fallbackName = firebaseUser.displayName || 'Google User'
      return {
        id: firebaseUser.uid,
        name: fallbackName,
        email: firebaseUser.email || 'user@gmail.com',
        phone: firebaseUser.phoneNumber || '+91 98765 43210',
        photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=4285F4&color=fff`,
      }
    } catch (firebaseError: any) {
      console.warn('[AuthService] Firebase popup restricted or API key unconfigured:', firebaseError)
      throw new Error('REQUIRE_ACCOUNT_CHOOSER')
    }
  }

  async signInWithEmail(email: string): Promise<User> {
    await delay(400)
    const rawName = email.split('@')[0].replace('.', ' ')
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
    return {
      id: uid('user'),
      name: formattedName,
      email,
      phone: '+91 98765 43210',
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=0D8ABC&color=fff`,
    }
  }

  async signup(name: string, email: string): Promise<User> {
    await delay(400)
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1)
    return {
      id: uid('user'),
      name: formattedName,
      email,
      phone: '+91 98765 43210',
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=0D8ABC&color=fff`,
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth)
    } catch (e) {
      // Ignore if not signed into Firebase SDK session
    }
    await delay(200)
  }
}

export const authService = new AuthService()

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
