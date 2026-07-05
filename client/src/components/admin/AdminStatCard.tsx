interface AdminStatCardProps {
  label: string
  value: string
  helper: string
  icon: string
}

const AdminStatCard = ({ label, value, helper, icon }: AdminStatCardProps) => {
  return (
    <div className="flex items-center gap-4 rounded-md border border-gray-500/20 bg-white p-6 shadow-sm">
      <img src={icon} alt="" className="w-12 shrink-0" />
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-xs text-gray-400">{helper}</p>
      </div>
    </div>
  )
}

export default AdminStatCard
