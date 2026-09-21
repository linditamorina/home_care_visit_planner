'use client'

import { useState } from 'react'
import { logoutAction } from './actions'

export default function LogoutButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  return (
    <>
      {/* Butoni kryesor i daljes në Sidebar */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-lg transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Dil nga sistemi
      </button>

      {/* Modali i Konfirmimit */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden text-left">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">
                Dalje nga sistemi
              </h3>
              <p className="text-sm text-slate-600 font-medium">
                Jeni i sigurt që dëshironi të dilni? Sesioni juaj do të mbyllet dhe do t&apos;ju duhet të logoheni sërish.
              </p>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsOpen(false)} 
                disabled={isPending}
                className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Anulo
              </button>
              
              <form action={() => {
                setIsPending(true)
                logoutAction()
              }}>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                >
                  {isPending ? 'Po dalim...' : 'Po, dil'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}