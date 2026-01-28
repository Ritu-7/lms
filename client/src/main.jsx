import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppContextProvider } from './context/AppContextProvider'


// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl='/'>
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
)
