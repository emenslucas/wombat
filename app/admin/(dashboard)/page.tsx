import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function AdminDashboard() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  // The main dashboard is now at /dashboard
  redirect('/dashboard')
}
