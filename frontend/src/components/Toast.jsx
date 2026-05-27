import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success', duration = 2000, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Small delay to trigger animation
    const showTimer = setTimeout(() => setVisible(true), 10)
    
    // Timer to start hiding
    const hideTimer = setTimeout(() => {
      setVisible(false)
    }, duration)

    // Timer to completely remove/call onClose
    const closeTimer = setTimeout(() => {
      if (onClose) onClose()
    }, duration + 300) // 300ms for transition duration

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      clearTimeout(closeTimer)
    }
  }, [duration, onClose])

  const baseClasses = "fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl font-medium text-white transition-all duration-300 z-50 flex items-center gap-2"
  const visibleClasses = visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-5"
  
  const typeClasses = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600"
  }

  return (
    <div className={`${baseClasses} ${visibleClasses} ${typeClasses[type]}`}>
      {type === 'success' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {message}
    </div>
  )
}
