import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus,
  CheckCircle2,
  PackageSearch,
  Lock,
  X
} from 'lucide-react'
import { useCartStore } from '../store/useCartStore'
import { useNotificationStore } from '../store/useNotificationStore'
import PageWrapper from '../components/PageWrapper'
import Card from '../design-system/components/Card'
import Button from '../design-system/components/Button'
import Badge from '../design-system/components/Badge'
import AnimatedNumber from '../components/AnimatedNumber'
import BulkSelectorModal from '../components/BulkSelectorModal'
import { salesApi } from '../api/sales'
import { inventoryApi } from '../api/inventory'
import { corteApi } from '../api/corte'
import { useAuthStore } from '../store/useAuthStore'
import mascotaFrontal from '../assets/mascota-frontal.png'

const CATEGORY_ICONS = {
  'Alimentos': '🦴',
  'Higiene': '🧽',
  'Uso Diario': '🧽',
  'Juguete': '🎾',
  'Juguetes': '🎾',
  'Accesorio': '🎀',
  'Accesorios': '🎀',
  'Medicamento': '💉',
  'Medicamentos': '💉',
  'Snack': '🍬',
  'Snacks': '🍬',
  'General': '📦',
}

const POS = () => {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(null)
  const [bulkModal, setBulkModal] = useState({ isOpen: false, product: null })
  const [successModal, setSuccessModal] = useState(null)
  const [processingCheckout, setProcessingCheckout] = useState(false)
  const [countdown, setCountdown] = useState(0)
  
  const { items, addItem, removeItem, updateQuantity, getTotal, clear, paymentMethod, setPaymentMethod } = useCartStore()
  const { addNotification } = useNotificationStore()
  const { user } = useAuthStore()

  useEffect(() => {
    fetchProducts()
    checkRegisterStatus()
  }, [])

  const checkRegisterStatus = async () => {
    try {
      const res = await corteApi.getStatus()
      if (res.success) {
        setRegisterOpen(res.data.is_open)
      } else {
        setRegisterOpen(false)
      }
    } catch {
      setRegisterOpen(false)
    }
  }

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const res = await inventoryApi.getProducts()
      if (res.success) {
        setProducts(res.data)
        const cats = ['Todos', ...new Set(res.data.map(p => p.category || 'General').filter(Boolean))]
        setCategories(cats)
      }
    } catch (err) {
      addNotification('Error al cargar productos', 'error')
    } finally {
      setLoadingProducts(false)
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
        (p.barcode && p.barcode.includes(search))
      const matchesCategory = selectedCategory === 'Todos' || (p.category || 'General') === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [search, selectedCategory, products])

  const handleAddToCart = (product) => {
    const totalStock = product.is_bulk ? (product.stock || 0) + ((product.bulto_stock || 0) * (product.bulto_weight || 0)) : product.stock;
    if (totalStock <= 0) {
      addNotification(`Sin stock de ${product.name}`, 'error')
      return
    }
 
    if (product.is_bulk) {
      setBulkModal({ isOpen: true, product })
      return
    }
 
    addItem(product)
    addNotification(`${product.name} agregado`, 'success')
  }
 
  const handleConfirmBulk = (product, quantity) => {
    addItem(product, quantity)
    addNotification(`${product.name} (${quantity.toFixed(3)}kg) agregado`, 'success')
  }

  const handleCheckout = async () => {
    if (items.length === 0) return
    if (processingCheckout) return

    if (!registerOpen) {
      addNotification('La caja está cerrada. Abre un turno en Finanzas antes de vender.', 'error')
      return
    }

    setProcessingCheckout(true)
    try {
      const saleData = {
        items: items.map(i => ({
          product_id: i.id,
          quantity: i.quantity,
          price: i.price
        })),
        payment_method: paymentMethod,
        seller: user?.username,
        total: getTotal()
      }
      
      const res = await salesApi.createSale(saleData)
      if (res.success) {
        const folio = res.data?.folio || `GM-${1000 + (res.data?.sale_id || 0)}`
        const roundedTotal = Math.round(getTotal() * 100) / 100
        setSuccessModal({ folio, total: roundedTotal, method: paymentMethod })
        setCountdown(3)
        clear()
        fetchProducts()
      } else {
        addNotification(res.error || 'Error al procesar venta', 'error')
      }
    } catch (err) {
      addNotification('Error al procesar venta', 'error')
    } finally {
      setProcessingCheckout(false)
    }
  }

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => {
      if (countdown === 1) {
        setSuccessModal(null)
        setCountdown(0)
      } else {
        setCountdown(c => c - 1)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const paymentLabel = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }

  return (
    <PageWrapper className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* COLUMNA IZQUIERDA: BUSCADOR Y CATÁLOGO */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <Card className="p-4" padding="p-4">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={22} />
                <input
                  type="text"
                  placeholder="Buscar por nombre o código de barras..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-bg-main border-none rounded-2xl focus:ring-2 focus:ring-[#C62828]/30 outline-none font-bold text-lg transition-all"
                  autoFocus
                />
              </div>
              {/* Filtros de categoría */}
              {categories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'text-white bg-brand shadow-lg shadow-brand/20'
                          : 'bg-bg-main text-text-muted hover:text-brand border border-border-subtle'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {registerOpen === false && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600">
              <Lock size={20} className="shrink-0" />
              <p className="font-bold text-sm">La caja está cerrada. Ve a <strong>Finanzas → Caja</strong> para abrir un turno antes de vender.</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loadingProducts ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                <AnimatePresence>
                  {filteredProducts.map((product) => (
                    <motion.button
                      layout
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddToCart(product)}
                      className="group relative flex flex-col bg-bg-card p-4 rounded-3xl soft-shadow border-2 border-transparent hover:border-brand/30 hover:bg-brand/5 transition-all text-left overflow-hidden"
                    >
                      <div 
                        className="relative z-10 mb-3 w-full aspect-square rounded-2xl flex items-center justify-center transition-colors group-hover:scale-[1.02] duration-300 bg-brand/10 dark:bg-brand/20"
                      >
                        <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                          {CATEGORY_ICONS[product.category] || CATEGORY_ICONS['General']}
                        </span>
                      </div>
                      
                      <h3 className="relative z-10 font-bold text-text-main line-clamp-2 leading-tight h-10 mb-1 text-shadow-sm">
                        {product.name}
                      </h3>
                      
                      <div className="relative z-10 flex items-center justify-between mt-auto">
                        <span className="text-lg font-black text-brand">${product.price}</span>
                        <Badge variant={(product.is_bulk ? (product.stock + (product.bulto_stock * product.bulto_weight)) : product.stock) > (product.min_stock || 5) ? 'success' : (product.is_bulk ? (product.stock + (product.bulto_stock * product.bulto_weight)) : product.stock) > 0 ? 'warning' : 'error'} size="sm">
                          {product.is_bulk ? `${(product.stock + (product.bulto_stock * product.bulto_weight))?.toFixed ? (product.stock + (product.bulto_stock * product.bulto_weight)).toFixed(1) : (product.stock + (product.bulto_stock * product.bulto_weight))}kg` : `${product.stock} uds`}
                        </Badge>
                      </div>

                      {(product.is_bulk ? (product.stock + (product.bulto_stock * product.bulto_weight)) : product.stock) <= 0 && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center p-4 z-20">
                          <Badge variant="error">Sin Stock</Badge>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </AnimatePresence>
                
                {filteredProducts.length === 0 && !loadingProducts && (
                  <div className="col-span-full py-20 flex flex-col items-center text-text-muted">
                    <PackageSearch size={64} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="text-xl font-bold">No se encontraron productos</p>
                    <p className="text-sm mt-1 opacity-60">Intenta con otro término o categoría</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: CARRITO Y COBRO */}
        <Card className="w-full lg:w-[480px] flex flex-col overflow-hidden relative shadow-2xl" padding="p-0">
          <div 
            className="p-6 border-b-2 border-dashed flex items-center justify-between relative overflow-hidden bg-brand/5 border-brand/20"
          >
            <div className="flex items-center gap-3 relative z-10">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-brand"
              >
                <ShoppingCart size={20} />
              </div>
              <div>
                <h2 className="font-sans font-extrabold tracking-tight text-xl text-brand">Carrito Activo</h2>
                <p className="text-[10px] text-text-muted font-black uppercase tracking-wider">{items.length} ítems en lista</p>
              </div>
            </div>
            
            <img 
              src={mascotaFrontal} 
              alt="Mascota" 
              className="absolute right-12 bottom-0 w-24 h-24 object-contain translate-y-2 opacity-90 z-0"
            />

            <button 
              onClick={clear}
              className="p-2 text-text-muted transition-colors hover:text-[#C62828] relative z-10 bg-white/50 hover:bg-white rounded-full backdrop-blur-sm"
              title="Limpiar carrito"
            >
              <Trash2 size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-gradient-to-b from-brand/20 via-brand/5 to-transparent" style={{ boxShadow: 'inset 0 0 40px rgba(var(--brand-rgb), 0.15)' }}>
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 p-3 bg-bg-card/90 backdrop-blur-md rounded-2xl border border-brand/20 shadow-lg shadow-brand/10 hover:border-brand/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-main text-sm truncate">{item.name}</p>
                    <p className="text-xs font-black text-brand">${item.price} / {item.unit || 'ud'}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-bg-card rounded-xl border border-border-subtle p-1">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - (item.is_bulk ? 0.1 : 1))}
                      className="w-7 h-7 flex items-center justify-center text-text-muted transition-colors hover:text-[#C62828]"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center font-bold text-sm">
                      {item.is_bulk ? item.quantity.toFixed(3) : item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + (item.is_bulk ? 0.1 : 1))}
                      className="w-7 h-7 flex items-center justify-center text-text-muted transition-colors hover:text-[#C62828]"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="text-right min-w-[70px] flex flex-col items-end">
                    {item.hasPromo && (
                      <p className="text-[10px] text-text-muted line-through font-bold mb-0.5">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    )}
                    <p className="font-black text-text-main">${(item.subtotal || 0).toFixed(2)}</p>
                    {item.hasPromo && (
                      <p className="text-[9px] text-green-500 font-bold bg-green-500/10 px-1 rounded mt-0.5 whitespace-nowrap">
                        Ahorro -${((item.price * item.quantity) - item.subtotal).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-text-muted transition-colors hover:text-[#C62828]"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {items.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted opacity-30 py-20">
                <ShoppingCart size={48} strokeWidth={1} className="mb-2" />
                <p className="font-bold">El carrito está vacío</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-bg-card z-10 relative shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.1)] space-y-3">
            {/* Métodos de Pago */}
            <div className="flex gap-2">
              {[
                { id: 'cash', emoji: '🪙', label: 'Efectivo' },
                { id: 'card', emoji: '💳', label: 'Tarjeta' },
                { id: 'transfer', emoji: '📱', label: 'Transf.' },
              ].map((m) => {
                const isActive = paymentMethod === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all ${
                      isActive ? 'bg-brand border-brand text-white' : 'bg-transparent border-border-subtle text-text-muted hover:border-brand/30'
                    }`}
                  >
                    <span className="text-xl drop-shadow-sm">{m.emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider">{m.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Totales */}
            <div className="space-y-1 py-1">
              <div className="flex justify-between text-text-muted font-bold text-sm px-1">
                <span>Subtotal</span>
                <span>$<AnimatedNumber value={getTotal()} /></span>
              </div>
              <div className="flex justify-between text-text-main font-black text-2xl px-1 pt-3 border-t-2 border-dashed border-brand/20">
                <span className="font-sans font-extrabold tracking-tight text-brand">Total</span>
                <span className="text-brand">$<AnimatedNumber value={getTotal()} /></span>
              </div>
            </div>

            <Button 
              className={`w-full py-4 text-lg tracking-tight font-black rounded-2xl transition-all ${
                !registerOpen 
                  ? '!bg-red-400 !shadow-none cursor-not-allowed text-white' 
                  : (items.length > 0 ? 'bg-brand text-white shadow-lg shadow-brand/40' : 'bg-bg-main text-text-muted border border-border-subtle')
              }`}
              disabled={items.length === 0 || processingCheckout || registerOpen === false}
              onClick={handleCheckout}
              icon={registerOpen === false ? Lock : CheckCircle2}
            >
              {processingCheckout ? 'Procesando...' : registerOpen === false ? 'Caja Cerrada' : 'Confirmar Venta'}
            </Button>
          </div>
        </Card>
      </div>

      <BulkSelectorModal 
        isOpen={bulkModal.isOpen} 
        onClose={() => setBulkModal({ isOpen: false, product: null })}
        product={bulkModal.product || {}}
        onConfirm={handleConfirmBulk}
      />

      {/* Modal de Éxito — se cierra automáticamente */}
      <AnimatePresence>
        {successModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-bg-card rounded-3xl p-10 max-w-sm w-full mx-4 text-center soft-shadow border-2 border-brand/20"
            >
              {/* Ícono con borde de countdown circular */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="36" fill="none" stroke="#fce7e7" strokeWidth="4" />
                  <circle
                    cx="40" cy="40" r="36" fill="none"
                    stroke="currentColor" className="text-brand" strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - countdown / 3)}`}
                    style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-brand">
                  <CheckCircle2 size={38} />
                </div>
              </div>

              <h2 className="text-3xl font-sans font-extrabold tracking-tight mb-1 text-brand">¡Venta Exitosa!</h2>
              <p className="text-text-muted font-medium mb-5">
                Cerrando en <span className="font-black text-brand">{countdown}s</span>…
              </p>

              <div className="rounded-2xl p-4 mb-0 space-y-2 text-left bg-brand/5">
                <div className="flex justify-between">
                  <span className="text-xs font-black text-text-muted uppercase tracking-wider">Folio</span>
                  <span className="font-black text-text-main">{successModal.folio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-black text-text-muted uppercase tracking-wider">Total</span>
                  <span className="font-black text-lg text-brand">${successModal.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-black text-text-muted uppercase tracking-wider">Método</span>
                  <span className="font-bold text-text-main">{paymentLabel[successModal.method] || successModal.method}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}

export default POS
