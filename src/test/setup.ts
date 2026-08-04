import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

beforeAll(() => {
  // jsdom does not implement IntersectionObserver; stub it for Framer Motion
  // whileInView and any lazy-visibility logic.
  if (typeof globalThis.IntersectionObserver === 'undefined') {
    class IntersectionObserverStub implements IntersectionObserver {
      readonly root = null
      readonly rootMargin = ''
      readonly scrollMargin = ''
      readonly thresholds = []

      disconnect() {}
      observe() {}
      takeRecords(): IntersectionObserverEntry[] {
        return []
      }
      unobserve() {}
    }

    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
  }
})

afterEach(() => {
  cleanup()
})
