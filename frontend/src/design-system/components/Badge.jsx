import React from 'react'

const Badge = ({ children, variant = 'primary', size = 'md', className = '' }) => {
  const variants = {
    primary: 'bg-brand/20 text-brand border-brand/10',
    success: 'bg-green-100 text-green-600 border-green-200',
    warning: 'bg-amber-100 text-amber-600 border-amber-200',
    error:   'bg-red-100 text-red-600 border-red-200',
    info:    'bg-blue-100 text-blue-600 border-blue-200',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  }

  return (
    <span className={`
      inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-full border
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `}>
      {children}
    </span>
  )
}

export default Badge
