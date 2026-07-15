import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Scale, Banknote, CheckCircle2 } from 'lucide-react'
import Button from '../design-system/components/Button'
import Input from '../design-system/components/Input'

const BulkSelectorModal = ({ isOpen, onClose, product, onConfirm }) => {
  const [mode, setMode] = useState('weight') // 'weight' | 'money'
  const [weightUnit, setWeightUnit] = useState('kg') // 'kg' | 'g'
  const [value, setValue] = useState('')
  const [calculatedWeight, setCalculatedWeight] = useState(0)
  const [calculatedPrice, setCalculatedPrice] = useState(0)

  useEffect(() => {
    if (!value || isNaN(value)) {
      setCalculatedWeight(0)
      setCalculatedPrice(0)
      return
    }

    const numValue = parseFloat(value)

    if (mode === 'weight') {
      const weightInKg = weightUnit === 'kg' ? numValue : numValue / 1000
      setCalculatedWeight(weightInKg)
      setCalculatedPrice(weightInKg * product.price)
    } else {
      const weightInKg = numValue / product.price
      setCalculatedWeight(weightInKg)
      setCalculatedPrice(numValue)
    }
  }, [value, mode, weightUnit, product.price])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (calculatedWeight <= 0) return
    onConfirm(product, calculatedWeight)
    onClose()
    setValue('')
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-bg-card w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
        >
          {/* Header */}
          <div className="p-6 bg-brand/10 flex items-center justify-between border-b border-brand/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white shadow-lg">
                <Scale size={20} />
              </div>
              <div>
                <h3 className="font-black text-brand uppercase tracking-tighter">Venta a Granel</h3>
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">{product.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-text-muted hover:text-brand transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-8 space-y-6">
            {/* Price Info */}
            <div className="flex items-center justify-between p-4 bg-bg-main rounded-2xl border border-border-subtle">
              <span className="text-sm font-bold text-text-muted">Precio por Kg</span>
              <span className="text-xl font-black text-brand">${product.price}</span>
            </div>

            {/* Selector de Modo */}
            <div className="flex gap-2 p-1 bg-bg-main rounded-2xl border border-border-subtle">
              <button
                onClick={() => { setMode('weight'); setValue(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all
                  ${mode === 'weight' ? 'bg-white dark:bg-bg-card text-brand shadow-sm' : 'text-text-muted hover:text-brand'}`}
              >
                <Scale size={16} /> Pesaje
              </button>
              <button
                onClick={() => { setMode('money'); setValue(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all
                  ${mode === 'money' ? 'bg-white dark:bg-bg-card text-brand shadow-sm' : 'text-text-muted hover:text-brand'}`}
              >
                <Banknote size={16} /> Monto ($)
              </button>
            </div>

            {/* Input Principal */}
            <div className="space-y-4">
              {mode === 'weight' ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWeightUnit('kg')}
                      className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                        ${weightUnit === 'kg' ? 'bg-brand text-white shadow-md' : 'bg-bg-main text-text-muted border border-border-subtle'}`}
                    >
                      Kilos (Kg)
                    </button>
                    <button
                      onClick={() => setWeightUnit('g')}
                      className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                        ${weightUnit === 'g' ? 'bg-brand text-white shadow-md' : 'bg-bg-main text-text-muted border border-border-subtle'}`}
                    >
                      Gramos (g)
                    </button>
                  </div>
                  <Input
                    type="number"
                    placeholder={`Cantidad en ${weightUnit === 'kg' ? 'Kilos' : 'Gramos'}...`}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="text-2xl font-black text-center"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Monto en Pesos ($)</label>
                  <Input
                    type="number"
                    placeholder="¿Cuánto quiere llevar el cliente? ($)"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="text-2xl font-black text-center"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Resumen Calculado */}
            <div className="grid grid-cols-2 gap-4 p-6 bg-brand/5 rounded-3xl border-2 border-dashed border-brand/20">
              <div className="text-center space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Equivale a</p>
                <p className="text-2xl font-black text-brand">
                  {calculatedWeight >= 1 
                    ? `${calculatedWeight.toFixed(3)} Kg` 
                    : `${(calculatedWeight * 1000).toFixed(0)} g`}
                </p>
              </div>
              <div className="text-center space-y-1 border-l border-brand/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Costo</p>
                <p className="text-2xl font-black text-text-main">${calculatedPrice.toFixed(2)}</p>
              </div>
            </div>

            <Button
              className="w-full py-4 text-xl tracking-tighter uppercase font-black"
              disabled={calculatedWeight <= 0}
              onClick={handleConfirm}
              icon={CheckCircle2}
            >
              Agregar al Carrito
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default BulkSelectorModal
