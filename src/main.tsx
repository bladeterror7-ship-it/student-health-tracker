import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App.tsx'
import RootErrorBoundary from './components/RootErrorBoundary.tsx'
import { AppStorageSyncProvider } from './context/AppStorageSyncProvider.tsx'
import { AuthProvider } from './context/AuthProvider.tsx'
import { MedicalDataProvider } from './context/MedicalDataProvider.tsx'
import { NotificationsProvider } from './context/NotificationsProvider.tsx'
import { StudentRegistryProvider } from './context/StudentRegistryProvider.tsx'
import { installStorageSync } from './lib/installStorageSync'
import './index.css'

installStorageSync()

const mount = document.getElementById('root')
if (!mount) {
  document.body.innerHTML =
    '<p style="padding:1rem;font-family:system-ui">#root элемент олдсонгүй. index.html шалга.</p>'
} else {
  createRoot(mount).render(
    <StrictMode>
      <RootErrorBoundary>
        <BrowserRouter>
          <AppStorageSyncProvider>
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
          </AppStorageSyncProvider>
        </BrowserRouter>
      </RootErrorBoundary>
    </StrictMode>,
  )
}
