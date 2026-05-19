import DashboardShell from '../components/DashboardShell'
import StudentDashboard from '../dashboards/student/StudentDashboard'

export default function StudentWorkspacePage() {
  return (
    <DashboardShell>
      <StudentDashboard />
    </DashboardShell>
  )
}
