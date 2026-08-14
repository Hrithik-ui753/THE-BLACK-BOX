/**
 * Centralized API & Backend URL resolution for Frontend
 */
export function getBackendUrl(): string {
  const envUrl = import.meta.env.VITE_BACKEND_URL
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.replace(/\/$/, '')
  }

  // If running in browser on Vercel or production domain without explicit VITE_BACKEND_URL
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname
    if (host !== 'localhost' && host !== '127.0.0.1') {
      // In production, fallback to relative path or environment default
      return window.location.origin
    }
  }

  return 'http://localhost:5000'
}

export const BACKEND_URL = getBackendUrl()
