interface AdminEmptyStateProps {
  title: string
  description: string
}

const AdminEmptyState = ({ title, description }: AdminEmptyStateProps) => {
  return (
    <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
    </div>
  )
}

export default AdminEmptyState