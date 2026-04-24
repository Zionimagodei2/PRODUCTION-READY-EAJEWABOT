'use client'

import { useState, useEffect, useCallback } from 'react'

// Permission types for the app
export type AppPermission = 'notifications' | 'camera' | 'microphone' | 'contacts' | 'geolocation'

interface PermissionState {
  granted: boolean
  denied: boolean
  prompt: boolean
}

// Check current permission status
export function checkPermission(permission: AppPermission): Promise<PermissionState> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ granted: false, denied: false, prompt: true })
      return
    }

    switch (permission) {
      case 'notifications':
        if (!('Notification' in window)) {
          resolve({ granted: false, denied: true, prompt: false })
          return
        }
        if (Notification.permission === 'granted') {
          resolve({ granted: true, denied: false, prompt: false })
        } else if (Notification.permission === 'denied') {
          resolve({ granted: false, denied: true, prompt: false })
        } else {
          resolve({ granted: false, denied: false, prompt: true })
        }
        break

      case 'camera':
      case 'microphone':
        if (navigator.permissions) {
          navigator.permissions.query({ name: permission as PermissionName })
            .then((result) => {
              if (result.state === 'granted') resolve({ granted: true, denied: false, prompt: false })
              else if (result.state === 'denied') resolve({ granted: false, denied: true, prompt: false })
              else resolve({ granted: false, denied: false, prompt: true })
            })
            .catch(() => resolve({ granted: false, denied: false, prompt: true }))
        } else {
          resolve({ granted: false, denied: false, prompt: true })
        }
        break

      case 'geolocation':
        if (navigator.permissions) {
          navigator.permissions.query({ name: 'geolocation' })
            .then((result) => {
              if (result.state === 'granted') resolve({ granted: true, denied: false, prompt: false })
              else if (result.state === 'denied') resolve({ granted: false, denied: true, prompt: false })
              else resolve({ granted: false, denied: false, prompt: true })
            })
            .catch(() => resolve({ granted: false, denied: false, prompt: true }))
        } else {
          resolve({ granted: false, denied: false, prompt: true })
        }
        break

      default:
        resolve({ granted: false, denied: false, prompt: true })
    }
  })
}

// Request a specific permission
export async function requestPermission(permission: AppPermission): Promise<boolean> {
  try {
    switch (permission) {
      case 'notifications':
        if (!('Notification' in window)) return false
        const notifResult = await Notification.requestPermission()
        return notifResult === 'granted'

      case 'camera':
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          stream.getTracks().forEach(t => t.stop())
          return true
        } catch {
          return false
        }

      case 'microphone':
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach(t => t.stop())
          return true
        } catch {
          return false
        }

      case 'geolocation':
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 5000 }
          )
        })

      default:
        return false
    }
  } catch {
    return false
  }
}

// Hook to use permission state
export function usePermission(permission: AppPermission) {
  const [state, setState] = useState<PermissionState>({ granted: false, denied: false, prompt: true })

  useEffect(() => {
    checkPermission(permission).then(setState)
  }, [permission])

  const request = useCallback(async () => {
    const granted = await requestPermission(permission)
    if (granted) {
      setState({ granted: true, denied: false, prompt: false })
    } else {
      setState({ granted: false, denied: true, prompt: false })
    }
    return granted
  }, [permission])

  return { ...state, request }
}

// Hook for PWA install prompt
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      queueMicrotask(() => setIsInstalled(true))
      return
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    
    if (result.outcome === 'accepted') {
      setIsInstalled(true)
      setIsInstallable(false)
      return true
    }
    return false
  }, [deferredPrompt])

  return { isInstallable, isInstalled, install }
}

// Type for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
