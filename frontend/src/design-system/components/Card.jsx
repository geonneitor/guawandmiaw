import React from 'react'
import { motion } from 'framer-motion'

const Card = ({ children, className = '', hover = false, padding = 'p-6' }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -5, shadow: '0 20px 40px -10px rgba(255,183,197,0.2)' } : {}}
      className={`
        soft-card ${padding} ${className}
        transition-all duration-300
      `}
    >
      {children}
    </motion.div>
  )
}

export default Card
