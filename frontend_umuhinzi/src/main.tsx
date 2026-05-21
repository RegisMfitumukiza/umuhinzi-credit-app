import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App'
import ErrorBoundary from './shared/components/ErrorBoundary'
import { ThemeProvider } from './shared/context/ThemeContext'
import { StoreProvider } from './store'
import { queryClient } from './lib/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StoreProvider>
          <ThemeProvider>
            <App />
            <Toaster position="top-right" />
          </ThemeProvider>
        </StoreProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
