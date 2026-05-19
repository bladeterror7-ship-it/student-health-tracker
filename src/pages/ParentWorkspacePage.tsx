import DashboardShell from '../components/DashboardShell'
import ParentDashboard from '../dashboards/parent/ParentDashboard'

export default function ParentWorkspacePage() {
  return (
    <DashboardShell>
      <ParentDashboard />
    </DashboardShell>
  )
}
