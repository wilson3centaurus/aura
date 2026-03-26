'use client'

export default function AdminReportsPage() {
  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">Hospital performance metrics and operational reports</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold">
          🚧 Work in Progress
        </div>
      </div>

      {/* Coming soon banner */}
      <div className="bg-gradient-to-br from-[#003d73]/5 to-blue-50 dark:from-blue-950/20 dark:to-[#111] border border-[#003d73]/20 dark:border-blue-900/30 rounded-2xl p-6 text-center">
        <div className="text-5xl mb-3">📊</div>
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">Reports Coming Soon</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Comprehensive analytics and reporting tools are currently under development. Check back soon for patient flow, revenue, and occupancy reports.
        </p>
      </div>

      {/* Skeleton report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Patient Flow Report', icon: '🧑‍⚕️', desc: 'Daily & weekly patient visit trends' },
          { title: 'Revenue & Fees Report', icon: '💰', desc: 'Fee collections and billing summary' },
          { title: 'Bed Occupancy Report', icon: '🛏️', desc: 'Ward utilisation and capacity analysis' },
          { title: 'Appointment Report', icon: '📅', desc: 'Booking rates, cancellations & doctor workload' },
          { title: 'Queue Analytics', icon: '🎫', desc: 'Average wait times and throughput' },
          { title: 'Medication Report', icon: '💊', desc: 'Stock levels, consumption and restocking alerts' },
        ].map(card => (
          <div key={card.title} className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{card.icon}</span>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{card.title}</p>
                <p className="text-[11px] text-gray-400">{card.desc}</p>
              </div>
              <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">SOON</span>
            </div>
            {/* Skeleton bars */}
            <div className="space-y-2">
              {[85, 60, 75, 45].map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-2.5 bg-gray-100 dark:bg-[#222] rounded-full flex-1">
                    <div className="h-full bg-gray-200 dark:bg-[#333] rounded-full animate-pulse" style={{ width: `${w}%` }} />
                  </div>
                  <div className="w-8 h-2 bg-gray-100 dark:bg-[#222] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-4">
        Analytics module is scheduled for a future release · AURA Hospital Management System
      </p>
    </div>
  )
}
