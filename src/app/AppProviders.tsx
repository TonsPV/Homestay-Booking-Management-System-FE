import { QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

import { AuthProvider } from '@/auth/AuthProvider'
import { ChatRealtimeBridge } from '@/features/chat/ChatRealtimeBridge'

import { createAppQueryClient } from './query-client'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(createAppQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatRealtimeBridge />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}
