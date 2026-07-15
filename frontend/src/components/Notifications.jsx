import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotificationStore } from '../store/useNotificationStore'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const Icons = {
  success: <CheckCircle className="text-green-500" />,
  error:   <XCircle className="text-red-500" />,
  warning: <AlertCircle className="text-amber-500" />,
  info:    <Info className="text-blue-500" />,
}

const BgColors = {
  success: 'bg-green-50 dark:bg-green-950/40 border-green-100 dark:border-green-900',
  error:   'bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900',
  warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900',
  info:    'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900',
}

const Notifications = () => {
  const { notifications, removeNotification } = useNotificationStore()

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-80 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`
              pointer-events-auto p-4 rounded-2xl border shadow-lg flex items-start gap-3
              ${BgColors[n.type] || BgColors.info}
            `}
          >
            <div className="mt-0.5">{Icons[n.type] || Icons.info}</div>
            <div className="flex-1 text-sm font-medium text-text-main">
              {n.message}
            </div>
            <button 
              onClick={() => removeNotification(n.id)}
              className="text-text-muted hover:text-text-main transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Notifications
