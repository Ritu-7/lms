import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Payments = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-gray-50/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor billing, refunds, and transaction outcomes.</p>
        </div>
      </div>

      <AdminSection title="Payments" description="Review payment records and processing states.">
        <AdminTable
          columns={["User", "Amount", "Status", "Method"]}
          rows={adminOverview.payments}
          rowActions={['View', 'Refund', 'Export']}
          emptyMessage="No payment data available."
        />
      </AdminSection>
    </div>
  )
}

export default Payments
