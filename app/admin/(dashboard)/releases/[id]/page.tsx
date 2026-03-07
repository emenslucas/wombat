import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function ReleaseDetailPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  redirect('/dashboard')
}
