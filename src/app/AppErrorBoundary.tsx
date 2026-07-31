import {
  Component,
  createRef,
  type ErrorInfo,
  type ReactNode,
} from 'react'

import { Button } from '@/shared/components/Button'

import { reportRuntimeError } from './error-reporting'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false }
  private readonly headingRef = createRef<HTMLHeadingElement>()

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportRuntimeError(error, 'react-boundary', {
      componentStack: info.componentStack,
    })
    this.headingRef.current?.focus()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          aria-labelledby="app-error-title"
          className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12"
        >
          <div className="w-full max-w-md rounded-panel border border-danger/20 bg-surface p-6 text-center shadow-card sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-danger">
              Lỗi ứng dụng
            </p>
            <h1
              className="mt-3 text-2xl font-black tracking-tight text-ink sm:text-3xl"
              id="app-error-title"
              ref={this.headingRef}
              tabIndex={-1}
            >
              Trang không thể hiển thị
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Một lỗi không mong đợi đã xảy ra. Hãy tải lại trang để thử
              khôi phục; dữ liệu đã gửi lên máy chủ không bị thay đổi bởi
              thao tác này.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={() => window.location.reload()}>
                Tải lại trang
              </Button>
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-control border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-elevation-1 transition duration-fast ease-calm hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none"
                href="/"
              >
                Về trang chủ
              </a>
            </div>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
