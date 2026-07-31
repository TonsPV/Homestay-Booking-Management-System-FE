import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installGlobalErrorReporting } from './app/error-reporting'
import './index.css'
import App from './App.tsx'

installGlobalErrorReporting()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
