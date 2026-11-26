import { useSyncExternalStore } from 'react'

export interface Route {
  name: string
  query: URLSearchParams
}

function parse(hash: string): Route {
  const clean = hash.replace(/^#/, '') || '/'
  const [path, search] = clean.split('?')
  const name = path.replace(/^\/+/, '').replace(/\/+$/, '') || 'home'
  return { name, query: new URLSearchParams(search ?? '') }
}

const listeners = new Set<() => void>()
const stack: string[] = []
let snapshot = parse(window.location.hash)
let raw = window.location.hash

function refresh(): void {
  const next = window.location.hash
  if (next === raw) return
  raw = next
  snapshot = parse(next)
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function navigate(to: string, replace = false): void {
  const target = to.startsWith('/') ? to : `/${to}`
  const current = raw.replace(/^#/, '') || '/'
  if (current === target) return
  if (!replace) stack.push(current)
  window.history.replaceState(null, '', `#${target}`)
  refresh()
}

export function back(fallback = '/'): void {
  const previous = stack.pop()
  if (previous !== undefined) {
    window.history.replaceState(null, '', `#${previous}`)
    refresh()
    return
  }
  if (raw.replace(/^#/, '') !== fallback) {
    window.history.replaceState(null, '', `#${fallback}`)
    refresh()
  }
}

export function canGoBack(): boolean {
  return stack.length > 0
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', refresh)
  window.addEventListener('popstate', refresh)
}
