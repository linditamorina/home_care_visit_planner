'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell, CheckCircle2, Trash2, X } from 'lucide-react'

type AppNotification = {
  id: string
  created_at: string
  visit_id: string
  patient_code: string
  title: string
  message: string
  is_read: boolean
}

export default function SupervisorNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false) // MODALI I RI
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('target_role', 'supervisor')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.is_read).length)
      }
    } catch (err) {
      console.error('Gabim gjatë marrjes së njoftimeve:', err)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications()

    const channel = supabase
      .channel('supervisor-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: 'target_role=eq.supervisor' },
        () => { fetchNotifications() }
      )
      .subscribe()

    const handleClickOutside = (event: MouseEvent) => {
      // Nëse modali i fshirjes është hapur, mos e mbyll dropdown-in automatikisht
      if (showClearModal) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('mousedown', handleClickOutside)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showClearModal])

  const handleMarkAsRead = async (id: string, is_read: boolean) => {
    if (is_read) return
    setUnreadCount(prev => Math.max(0, prev - 1))
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const notifToDelete = notifications.find(n => n.id === id)
    if (notifToDelete && !notifToDelete.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setNotifications(prev => prev.filter(n => n.id !== id))
    await supabase.from('notifications').delete().eq('id', id)
  }

  // EKZEKUTIMI FAKTKT I FSHIRJES
  const executeClearAll = async () => {
    setNotifications([])
    setUnreadCount(0)
    await supabase.from('notifications').delete().eq('target_role', 'supervisor')
    setShowClearModal(false)
    setIsOpen(false)
  }

  const getIconForNotification = (title: string) => {
    if (title.includes('Anulua')) return <X className="w-5 h-5 text-red-500" />
    if (title.includes('Përfundoi')) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    return <Bell className="w-5 h-5 text-blue-500" />
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow hover:bg-slate-50 transition-all focus:outline-none flex items-center justify-center"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-extrabold rounded-full ring-2 ring-white shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-3 w-80 sm:w-[400px] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-200">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Njoftimet e Sistemit</h3>
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {unreadCount} TË REJA
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button 
                  onClick={() => setShowClearModal(true)} // HAPIM MODALIN KËTU
                  className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
                >
                  Pastro
                </button>
              )}
            </div>

            <div className="max-h-[450px] overflow-y-auto divide-y divide-slate-100/80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-900 font-bold text-sm mb-1">Inbox i pastër!</p>
                  <p className="text-slate-500 font-medium text-xs">Nuk keni asnjë njoftim të ri për momentin.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id, notif.is_read)}
                    className={`flex items-start gap-3 p-4 transition-colors cursor-pointer group relative ${
                      !notif.is_read ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 border ${!notif.is_read ? 'bg-white border-blue-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                      {getIconForNotification(notif.title)}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-8">
                      <p className={`text-[13px] mb-1 leading-snug ${!notif.is_read ? 'text-slate-900 font-bold' : 'text-slate-700 font-semibold'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center gap-1.5">
                        <span>{new Date(notif.created_at).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{new Date(notif.created_at).toLocaleDateString('sq-AL', { day: 'numeric', month: 'short' })}</span>
                      </p>
                    </div>

                    <button 
                      onClick={(e) => handleDelete(notif.id, e)}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                      title="Fshij njoftimin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 absolute bottom-4 right-5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODALI PROFESIONAL I KONFIRMIMIT TË FSHIRJES */}
      {showClearModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pastro Njoftimet</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                A jeni i sigurt që dëshironi të fshini të gjitha njoftimet? Ky veprim nuk mund të kthehet mbrapsht.
              </p>
            </div>
            <div className="flex border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => setShowClearModal(false)}
                className="flex-1 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors border-r border-slate-100"
              >
                Anulo
              </button>
              <button 
                onClick={executeClearAll}
                className="flex-1 py-3.5 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                Po, Pastro
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}