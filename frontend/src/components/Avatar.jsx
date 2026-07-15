import React from 'react'

const Avatar = ({ name, role, size = 'md', src }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
  }

  const getInitials = (n) => {
    if (!n) return '?'
    return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className={`
      flex items-center justify-center rounded-2xl font-bold bg-brand/20 text-brand shadow-sm border border-brand/10
      ${sizes[size]}
    `}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover rounded-2xl" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}

export default Avatar
