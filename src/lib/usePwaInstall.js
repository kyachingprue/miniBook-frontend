import { useCallback, useEffect, useState } from 'react'

// Captured at module level so we don't miss the event if it fires before a component mounts.
let deferredPrompt = null
const listeners = new Set()
const notify = () => listeners.forEach(fn => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    deferredPrompt = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true)

const isIos = () =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent)

export function usePwaInstall() {
  const [, force] = useState(0)
  useEffect(() => {
    const fn = () => force(n => n + 1)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    notify()
    return outcome === 'accepted'
  }, [])

  const installed = isStandalone()
  return {
    installed,
    canInstall: !installed && Boolean(deferredPrompt), // Chrome / Edge / Android
    showIosHint: !installed && isIos() && !deferredPrompt, // Safari: manual "Add to Home Screen"
    install
  }
}
