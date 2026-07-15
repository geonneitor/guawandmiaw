import React from 'react'

const Spinner = ({ size = 'md', color = 'brand', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  }

  const colors = {
    brand: 'border-brand border-t-transparent',
    white: 'border-white border-t-transparent',
  }

  return (
    <div className={`
      animate-spin rounded-full
      ${sizes[size]}
      ${colors[color]}
      ${className}
    `} />
  )
}

export default Spinner
