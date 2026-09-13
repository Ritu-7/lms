import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import App from './App'
import { AppContextProvider } from './context/AppContextProvider'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'


// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

axios.defaults.withCredentials = true;
// Also can set baseURL if needed:
// axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl='/'>
        <ThemeProvider>
          <AuthProvider>
            <AppContextProvider>
              <App />
            </AppContextProvider>
          </AuthProvider>
        </ThemeProvider>
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
)
