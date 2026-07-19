import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Marrim disa metrika bazë (p.sh., numrin e vizitave të planifikuara)
  const { count: scheduledVisits } = await supabase
    .from('visits')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scheduled')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Karta 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Vizita të Planifikuara</h3>
          <p className="text-3xl font-bold text-slate-900">{scheduledVisits || 0}</p>
        </div>
        
        {/* Karta 2 (Placeholder për më vonë) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Stafi në Terren</h3>
          <p className="text-3xl font-bold text-slate-900">Aktiv</p>
        </div>

        {/* Karta 3 (Placeholder për më vonë) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Alertet e Sistemit</h3>
          <p className="text-3xl font-bold text-green-600">Normale</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Mirësevini në Sistemin Qendror</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Zgjidhni një nga modulet në menynë anësore për të filluar menaxhimin e orareve, 
          shikimin e shënimeve nga terreni ose gjenerimin e raporteve të auditimit.
        </p>
      </div>
    </div>
  )
}