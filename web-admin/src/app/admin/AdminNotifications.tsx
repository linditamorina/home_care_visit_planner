'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell, CheckCircle2, FlaskConical, ShieldAlert, Trash2, X } from 'lucide-react'

type AppNotification = {
  id: string
  created_at: string
  visit_id: string
  patient_code: string
  title: string
  message: string
  is_read: boolean
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: 'target_role=eq.admin' },
        () => { fetchNotifications() }
      )
      .subscribe()

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('target_role', 'admin')
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

  const handleClearAll = async () => {
    if (window.confirm('A jeni i sigurt që dëshironi të fshini të gjitha njoftimet?')) {
      setNotifications([])
      setUnreadCount(0)
      await supabase.from('notifications').delete().eq('target_role', 'admin')
      setIsOpen(false)
    }
  }

  const getIconForNotification = (title: string) => {
    if (title.includes('Fjalëkalim')) return <ShieldAlert className="w-5 h-5 text-amber-500" />
    if (title.includes('Anulua')) return <X className="w-5 h-5 text-red-500" />
    if (title.includes('Përfundoi')) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    return <FlaskConical className="w-5 h-5 text-blue-500" />
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all focus:outline-none flex items-center justify-center"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm">Qendra e Njoftimeve</h3>
              {unreadCount > 0 && (
                <span className="bg-purple-100 text-purple-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} të reja
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button onClick={handleClearAll} className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors">
                Fshij të gjitha
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium text-sm">Nuk keni asnjë njoftim të ri.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id, notif.is_read)}
                  className={`flex items-start gap-3 p-4 transition-colors cursor-pointer group relative ${
                    !notif.is_read ? 'bg-purple-50/50 hover:bg-purple-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${!notif.is_read ? 'bg-purple-100' : 'bg-slate-100'}`}>
                    {getIconForNotification(notif.title)}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-6">
                    <p className={`text-sm mb-1 ${!notif.is_read ? 'text-slate-900 font-bold' : 'text-slate-700 font-semibold'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-2">
                      {new Date(notif.created_at).toLocaleString('sq-AL', { 
                        hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' 
                      })}
                    </p>
                  </div>

                  <button 
                    onClick={(e) => handleDelete(notif.id, e)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                    title="Fshij"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-purple-600 absolute bottom-4 right-4" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}