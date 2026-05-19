import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App.tsx'
import RootErrorBoundary from './components/RootErrorBoundary.tsx'
import { AuthProvider } from './context/AuthProvider.tsx'
import { MedicalDataProvider } from './context/MedicalDataProvider.tsx'
import { NotificationsProvider } from './context/NotificationsProvider.tsx'
import { StudentRegistryProvider } from './context/StudentRegistryProvider.tsx'
import './index.css'

const mount = document.getElementById('root')
if (!mount) {
  document.body.innerHTML =
    '<p style="padding:1rem;font-family:system-ui">#root элемент олдсонгүй. index.html шалга.</p>'
} else {
  createRoot(mount).render(
    <StrictMode>
      <RootErrorBoundary>
        <BrowserRouter>
          <StudentRegistryProvider>
            <MedicalDataProvider>
              <AuthProvider>
                <NotificationsProvider>
                  <App />
                  <Toaster richColors position="top-right" closeButton />
                </NotificationsProvider>
              </AuthProvider>
            </MedicalDataProvider>
          </StudentRegistryProvider>
        </BrowserRouter>
      </RootErrorBoundary>
    </StrictMode>,
  )
}
