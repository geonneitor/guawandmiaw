import React from 'react'

const Input = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error, 
  className = '', 
  icon: Icon,
  ...props 
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-black text-text-main ml-4 uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <Icon className="absolute left-4 text-text-muted" size={20} />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            input-pastel w-full text-text-main font-medium
            ${Icon ? 'pl-12' : ''}
            ${error ? 'border-red-300 bg-red-50 focus:border-red-400' : ''}
          `}
          {...props}
        />
      </div>
      {error && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-red-500 font-medium ml-4"
        >
          {error}
        </motion.span>
      )}
    </div>
  )
}

export default Input
