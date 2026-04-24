import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

export function useAlert() {
  const [state, setState] = useState(null) // { message, variant }

  const showAlert = useCallback((message, variant = 'error') => {
    setState({ message, variant })
  }, [])

  const dismiss = useCallback(() => setState(null), [])

  const Modal = state
    ? createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={dismiss} />
          <div className="relative bg-[#1a2235] border border-white/10 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              {state.variant === 'error' ? (
                <div className="w-9 h-9 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-rose-400 w-5 h-5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-400">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              )}
              <p className="text-[14px] text-white/80 leading-relaxed pt-1">{state.message}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={dismiss}
                className="px-4 py-2 text-[13px] font-medium rounded-lg bg-white/10 text-white/80 hover:bg-white/15 hover:text-white transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null

  return { showAlert, AlertModal: Modal }
}
