import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { useAuth } from './context/useAuth'
import { dashboardPathForRole } from './lib/authRedirect'
import AdminWorkspacePage from './pages/AdminWorkspacePage'
import LoginPage from './pages/LoginPage'
import ParentWorkspacePage from './pages/ParentWorkspacePage'
import StudentWorkspacePage from './pages/StudentWorkspacePage'

function HomeRedirect() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={dashboardPathForRole(session.role)} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth roles={['student']}>
            <StudentWorkspacePage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth roles={['admin']}>
            <AdminWorkspacePage />
          </RequireAuth>
        }
      />
      <Route
        path="/parent"
        element={
          <RequireAuth roles={['parent']}>
            <ParentWorkspacePage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
