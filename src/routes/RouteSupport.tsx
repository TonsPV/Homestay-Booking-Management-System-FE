import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { LoadingState } from '@/shared/components/Feedback'

import { getDocumentTitle } from './route-titles'

export function RouteLoading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl px-4 py-16 focus:outline-none sm:px-6 lg:px-8"
      id="main-content"
      tabIndex={-1}
    >
      <LoadingState label="Đang mở trang…" />
    </main>
  )
}

export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = getDocumentTitle(pathname)
    window.scrollTo({ left: 0, top: 0, behavior: 'auto' })

    const animationFrame = window.requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus({
        preventScroll: true,
      })
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [pathname])

  return null
}
