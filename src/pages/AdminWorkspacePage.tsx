import AdminDashboard from '../dashboards/admin/AdminDashboard'
import DashboardShell from '../components/DashboardShell'

export default function AdminWorkspacePage() {
  return (
    <DashboardShell>
      <AdminDashboard />
    </DashboardShell>
  )
}
