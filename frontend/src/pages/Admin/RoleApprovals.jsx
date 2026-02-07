import { ShieldAlert } from 'lucide-react'

function RoleApprovals() {
  return (
    <div className="card-surface p-12 text-center max-w-2xl mx-auto mt-12">
      <ShieldAlert className="mx-auto h-16 w-16 text-brand-primary opacity-20" />
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Role Approvals</h1>
      <p className="mt-2 text-slate-500">
        This module is currently under maintenance. Please check back later or use the direct API for approvals.
      </p>
    </div>
  )
}

export default RoleApprovals
