import React from 'react'
import { motion } from 'framer-motion'

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false, 
  icon: Icon 
}) => {
  const variants = {
    primary: 'bg-brand text-white shadow-[0_8px_20px_-5px_rgba(255,183,197,0.4)] hover:bg-brand-dark',
    secondary: 'bg-white text-brand border-2 border-brand/20 hover:border-brand/40',
    outline: 'bg-transparent text-brand border-2 border-brand/50 hover:bg-brand/5',
    ghost: 'bg-transparent text-text-muted hover:bg-bg-hover hover:text-brand',
    danger: 'bg-red-400 text-white shadow-[0_8px_20px_-5px_rgba(248,113,113,0.3)] hover:brightness-110',
  }

  const sizes = {
    sm: 'px-4 py-1.5 text-sm rounded-xl',
    md: 'px-6 py-2.5 text-base rounded-2xl',
    lg: 'px-8 py-3.5 text-lg rounded-[1.25rem]',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2 font-bold transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
      {children}
    </motion.button>
  )
}

export default Button
