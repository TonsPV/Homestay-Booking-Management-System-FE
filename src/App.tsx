import { RouterProvider } from 'react-router-dom'

import { AppErrorBoundary } from '@/app/AppErrorBoundary'
import { AppProviders } from '@/app/AppProviders'
import { router } from '@/routes/router'

function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  )
}

export default App
