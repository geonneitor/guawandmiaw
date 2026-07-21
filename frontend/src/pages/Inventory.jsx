import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Package, 
  ArrowUpDown,
  AlertTriangle,
  Scale,
  Box,
  ChevronRight,
  Upload,
  Download,
  X
} from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import Card from '../design-system/components/Card'
import Button from '../design-system/components/Button'
import Input from '../design-system/components/Input'
import Badge from '../design-system/components/Badge'
import Modal from '../design-system/components/Modal'
import { useNotificationStore } from '../store/useNotificationStore'
import { useAuthStore } from '../store/useAuthStore'
import { useInventoryStore } from '../store/useInventoryStore'
import { inventoryApi } from '../api/inventory'
import Suppliers from './Suppliers'
import Restock from './Restock'
import BarcodeLabelPrinter from '../components/BarcodeLabelPrinter'
import BarcodeCameraScanner from '../components/BarcodeCameraScanner'

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('products')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [visibleCount, setVisibleCount] = useState(40)
  const [showFilters, setShowFilters] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const { user } = useAuthStore()
  
  const { products, categories, loadingProducts, fetchProducts } = useInventoryStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showPrinter, setShowPrinter] = useState(false)
  const [productsToPrint, setProductsToPrint] = useState([])
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    stock: '',
    min_stock: '',
    is_bulk: false,
    unit: 'ud',
    bulto_stock: 0,
    bulto_weight: 0,
    barcode: '',
    category: 'General',
    promo_active: false,
    promo_type: 'bundle',
    promo_min_quantity: '',
    promo_discount: '',
    promo_start_date: '',
    expiry_date: ''
  })

  const { addNotification } = useNotificationStore()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setVisibleCount(40)
  }, [debouncedSearch, selectedCategory])

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleImportExcel = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setIsImporting(true)
    try {
      const res = await inventoryApi.importExcel(formData)
      if (res.success) {
        addNotification(res.message || 'Inventario importado correctamente', 'success')
        fetchProducts(true)
      } else {
        addNotification(res.error || 'Error al importar el archivo', 'error')
      }
    } catch (err) {
      addNotification('Error al importar el archivo', 'error')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await inventoryApi.exportExcel()
      addNotification('Inventario exportado correctamente', 'success')
    } catch (err) {
      addNotification('Error al exportar inventario', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        ...product,
        category: product.category || 'General',
        promo_active: product.promo_active || false,
        promo_type: product.promo_type || 'bundle',
        promo_min_quantity: product.promo_min_quantity || '',
        promo_discount: product.promo_discount || '',
        promo_start_date: product.promo_start_date ? product.promo_start_date.split('T')[0] : '',
        expiry_date: product.expiry_date ? product.expiry_date.split('T')[0] : ''
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '', price: '', cost: '', stock: '', min_stock: '',
        is_bulk: false, unit: 'ud', bulto_stock: 0, bulto_weight: 0,
        barcode: '', category: categories.filter(c => c !== 'Todos')[0] || 'General',
        promo_active: false, promo_type: 'bundle', promo_min_quantity: '', promo_discount: '', promo_start_date: '', expiry_date: ''
      })
    }
    setIsAddingCategory(false)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let res
      if (editingProduct) {
        res = await inventoryApi.updateProduct(editingProduct.id, formData)
      } else {
        res = await inventoryApi.createProduct(formData)
      }
      
      if (res.success) {
        addNotification(editingProduct ? 'Producto actualizado' : 'Producto creado', 'success')
        setIsModalOpen(false)
        fetchProducts(true)
      }
    } catch (err) {
      addNotification('Error al guardar producto', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de archivar este producto? (Soft Delete)')) {
      try {
        const res = await inventoryApi.deleteProduct(id)
        if (res.success) {
          addNotification('Producto archivado', 'success')
          fetchProducts(true)
        }
      } catch (err) {
        addNotification('Error al archivar', 'error')
      }
    }
  }

  const handlePrintLabels = (prod = null) => {
    if (prod) {
      setProductsToPrint([prod])
    } else {
      setProductsToPrint(filteredProducts)
    }
    setShowPrinter(true)
  }

  const handleOpenBulto = async (id) => {
    try {
      const res = await inventoryApi.openBulto(id)
      if (res.success) {
        addNotification(res.message, 'success')
        fetchProducts(true)
      }
    } catch (err) {
      addNotification(err.response?.data?.error || 'Error al abrir bulto', 'error')
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        (p.barcode && p.barcode.includes(debouncedSearch))
      const matchesCategory = selectedCategory === 'Todos' || (p.category || 'General') === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [debouncedSearch, selectedCategory, products])

  return (
    <PageWrapper className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-sans font-extrabold tracking-tight text-[#C62828]">Inventario</h1>
          <p className="text-sm md:text-base text-text-muted font-medium">Gestión de stock y bultos a granel</p>
        </div>
        
        <div className="flex bg-bg-card/50 backdrop-blur-sm p-1.5 rounded-[1.5rem] border border-border-subtle shadow-sm self-start">
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-[#C62828] text-white shadow-lg shadow-[#C62828]/20' : 'text-text-muted hover:text-[#C62828]'}`}
          >
            Productos
          </button>
          <button 
            onClick={() => setActiveTab('promos')}
            className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'promos' ? 'bg-[#C62828] text-white shadow-lg shadow-[#C62828]/20' : 'text-text-muted hover:text-[#C62828]'}`}
          >
            Promociones
          </button>
          <button 
            onClick={() => setActiveTab('suppliers')}
            className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'suppliers' ? 'bg-[#C62828] text-white shadow-lg shadow-[#C62828]/20' : 'text-text-muted hover:text-[#C62828]'}`}
          >
            Proveedores
          </button>
          <button 
            onClick={() => setActiveTab('restock')}
            className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'restock' ? 'bg-[#C62828] text-white shadow-lg shadow-[#C62828]/20' : 'text-text-muted hover:text-[#C62828]'}`}
          >
            Resurtido
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'promos' && (
          <motion.div key="promos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.filter(p => p.promo_active).length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center text-text-muted">
                <p className="text-xl font-bold">No hay promociones activas</p>
                <p className="text-sm mt-1 opacity-60">Edita un producto y enciende la palanca de promo.</p>
              </div>
            ) : (
              products.filter(p => p.promo_active).map(prod => (
                <Card key={prod.id} className="p-5 flex flex-col justify-between border-2 border-brand/20 bg-brand/5 shadow-lg shadow-brand/10 hover:border-brand/50 transition-colors cursor-pointer group" onClick={() => handleOpenModal(prod)}>
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-bold text-text-main text-lg leading-tight">{prod.name}</h3>
                      <span className="bg-brand text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shrink-0">
                        {prod.promo_type === 'bundle' ? 'Paquete' : prod.promo_type === 'percent' ? '%' : 'Fijo'}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted mb-4">Precio Normal: <span className="font-bold text-text-main line-through">${prod.price}</span></p>
                    
                    <div className="space-y-1">
                      {prod.promo_type === 'bundle' && (
                        <p className="text-sm font-bold text-text-main">
                          Lleva {prod.promo_min_quantity || 'X'} por <span className="text-brand">${prod.promo_discount || 0}</span>
                        </p>
                      )}
                      {prod.promo_type === 'percent' && (
                        <p className="text-sm font-bold text-text-main">
                          Descuento del <span className="text-brand">{prod.promo_discount || 0}%</span>
                        </p>
                      )}
                      {prod.promo_type === 'fixed' && (
                        <p className="text-sm font-bold text-text-main">
                          Descuento de <span className="text-brand">${prod.promo_discount || 0}</span>
                        </p>
                      )}
                      
                      <div className="flex flex-col gap-0.5 mt-2 text-[10px] uppercase font-bold tracking-widest text-text-muted">
                        <p>Inicia: {prod.promo_start_date || 'Siempre'}</p>
                        <p>Termina: {prod.expiry_date || 'Nunca'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-brand/10 flex justify-end">
                    <button className="text-xs font-black uppercase tracking-widest text-brand group-hover:text-white group-hover:bg-brand px-3 py-1.5 rounded-lg transition-colors">
                      Editar Promo
                    </button>
                  </div>
                </Card>
              ))
            )}
          </motion.div>
        )}
        {activeTab === 'products' && (
          <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <Card className="flex-1 p-3" padding="p-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o código..."
                    className="w-full pl-12 pr-12 py-2 bg-transparent outline-none font-bold text-text-main"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button onClick={() => setIsScannerOpen(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand hover:text-brand-light transition-colors" title="Escanear con cámara">
                    📷
                  </button>
                </div>
              </Card>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="secondary" onClick={() => handlePrintLabels()} title="Imprimir Etiquetas Filtradas">🖨️ Etiquetas</Button>
                <Button 
                  variant={showFilters || selectedCategory !== 'Todos' ? 'primary' : 'secondary'} 
                  icon={Filter}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {selectedCategory === 'Todos' ? 'Filtros' : selectedCategory}
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".xlsx" 
                  style={{ display: 'none' }} 
                  onChange={handleImportExcel}
                />
                <Button 
                  variant="secondary" 
                  icon={Download} 
                  onClick={handleExportExcel}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exportando...' : 'Exportar Excel'}
                </Button>
                <Button 
                  variant="secondary" 
                  icon={Upload} 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  {isImporting ? 'Importando...' : 'Importar Excel'}
                </Button>
                <Button icon={Plus} onClick={() => handleOpenModal()}>Nuevo Producto</Button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <Card className="p-4 mb-4" padding="p-4">
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-brand text-white' : 'bg-bg-main text-text-muted hover:text-brand'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <Card className="overflow-hidden" padding="p-0">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-bg-main/50 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4">Categoría</th>
                      <th className="px-6 py-4">Precio</th>
                      <th className="px-6 py-4">Stock Actual</th>
                      <th className="px-6 py-4">Bultos</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredProducts.slice(0, visibleCount).map((prod) => (
                      <tr key={prod.id} className="hover:bg-bg-hover transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${prod.is_bulk ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-brand/5 text-brand border-brand/10'}`}>
                              {prod.is_bulk ? <Scale size={20} /> : <Package size={20} />}
                            </div>
                            <div>
                              <p className="font-bold text-text-main text-sm">{prod.name}</p>
                              <p className="text-[10px] text-text-muted font-mono">{prod.barcode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="info" size="sm">{prod.category || 'General'}</Badge>
                        </td>
                        <td className="px-6 py-4 font-black text-text-main">${prod.price}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <p className={`font-black text-sm ${prod.stock <= (prod.min_stock || 0) ? 'text-amber-500' : 'text-green-600'}`}>
                              {prod.is_bulk 
                                ? prod.bulto_weight > 0 
                                  ? `${( (prod.stock + (prod.bulto_stock * prod.bulto_weight)) / prod.bulto_weight ).toFixed(1)} Bultos`
                                  : `${prod.stock.toFixed(2)} Kg`
                                : `${prod.stock} uds`}
                            </p>
                            {prod.stock <= (prod.min_stock || 0) && (
                              <span className="text-[8px] font-black uppercase text-amber-500 flex items-center gap-1">
                                <AlertTriangle size={8} /> Stock Bajo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {prod.is_bulk ? (
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-text-main">{prod.bulto_stock} cerrado{prod.bulto_stock !== 1 && 's'}</span>
                                <span className="text-[9px] text-text-muted uppercase font-bold">{prod.stock?.toFixed ? prod.stock.toFixed(2) : prod.stock} kg suelto</span>
                              </div>
                              {prod.bulto_stock > 0 && (
                                <button 
                                  onClick={() => handleOpenBulto(prod.id)}
                                  className="p-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand hover:text-white transition-all"
                                  title="Abrir bulto y sumar al stock"
                                >
                                  <Box size={14} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-text-muted opacity-20">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handlePrintLabels(prod)} className="p-2 text-text-muted hover:text-brand" title="Imprimir Etiqueta">🖨️</button>
                            <button onClick={() => handleOpenModal(prod)} className="p-2 text-text-muted hover:text-brand"><Edit3 size={16} /></button>
                            <button onClick={() => handleDelete(prod.id)} className="p-2 text-text-muted hover:text-red-500" title="Archivar"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && !loadingProducts && (
                      <tr>
                        <td colSpan="6" className="px-6 py-20 text-center text-text-muted italic text-sm">
                          No hay productos que coincidan con la búsqueda
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile View */}
              <div className="md:hidden flex flex-col divide-y divide-border-subtle">
                {filteredProducts.slice(0, visibleCount).map((prod) => (
                  <div key={prod.id} className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex shrink-0 items-center justify-center border ${prod.is_bulk ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-brand/5 text-brand border-brand/10'}`}>
                          {prod.is_bulk ? <Scale size={20} /> : <Package size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-text-main line-clamp-2">{prod.name}</p>
                          <p className="text-[10px] text-text-muted font-mono">{prod.barcode}</p>
                        </div>
                      </div>
                      <p className="font-black text-brand whitespace-nowrap pl-2">${prod.price}</p>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <Badge variant="info" size="sm">{prod.category || 'General'}</Badge>
                      <div className="flex items-center gap-2">
                         <p className={`font-black ${prod.stock <= (prod.min_stock || 0) ? 'text-amber-500' : 'text-green-600'}`}>
                           {prod.is_bulk 
                             ? prod.bulto_weight > 0 
                               ? `${( (prod.stock + (prod.bulto_stock * prod.bulto_weight)) / prod.bulto_weight ).toFixed(1)} Bts`
                               : `${prod.stock.toFixed(2)} Kg`
                             : `${prod.stock} uds`}
                         </p>
                      </div>
                    </div>

                    {prod.is_bulk && prod.bulto_stock > 0 && (
                      <div className="bg-amber-50/50 rounded-lg p-2 flex justify-between items-center border border-amber-500/10 mt-1">
                         <span className="text-xs text-amber-600 font-bold">{prod.bulto_stock} bulto(s) cerrado(s)</span>
                         <button 
                           onClick={() => handleOpenBulto(prod.id)}
                           className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-black shadow-sm"
                         >
                           Abrir Bulto
                         </button>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-1 pt-3 border-t border-border-subtle/50">
                      <button onClick={() => handlePrintLabels(prod)} className="p-2 text-text-muted hover:text-brand bg-bg-main rounded-lg"><span className="text-lg">🖨️</span></button>
                      <button onClick={() => handleOpenModal(prod)} className="p-2 text-text-muted hover:text-brand bg-bg-main rounded-lg"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(prod.id)} className="p-2 text-text-muted hover:text-red-500 bg-bg-main rounded-lg"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && !loadingProducts && (
                  <div className="p-10 text-center text-text-muted italic text-sm">
                    No hay productos que coincidan
                  </div>
                )}
              </div>

              {visibleCount < filteredProducts.length && (
                <button 
                  onClick={() => setVisibleCount(v => v + 40)}
                  className="w-full py-4 bg-brand/5 text-brand font-bold hover:bg-brand/10 transition-colors"
                >
                  Mostrar más productos ({filteredProducts.length - visibleCount} restantes)
                </button>
              )}
            </Card>
          </motion.div>
        )}
        {activeTab === 'suppliers' && (
          <motion.div key="suppliers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Suppliers isTab={true} />
          </motion.div>
        )}
        {activeTab === 'restock' && (
          <motion.div key="restock" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Restock isTab={true} />
          </motion.div>
        )}
      </AnimatePresence>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        maxWidth="max-w-2xl"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Nombre del Producto" 
              className="md:col-span-2" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            
            <div className="md:col-span-2 flex items-center gap-4 p-4 bg-bg-main rounded-3xl border border-border-subtle">
              <div className="flex-1">
                <label className="text-xs font-black text-text-main uppercase tracking-widest ml-1">Tipo de Venta</label>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, is_bulk: true, unit: 'kg'})}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${formData.is_bulk ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white dark:bg-bg-card text-text-muted border border-border-subtle'}`}
                  >
                    A Granel (Kg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, is_bulk: false, unit: 'ud'})}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${!formData.is_bulk ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white dark:bg-bg-card text-text-muted border border-border-subtle'}`}
                  >
                    Por Unidad
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 md:col-span-1">
              <label className="text-xs font-black text-text-main uppercase tracking-widest ml-1">Código de Barras</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-text-main font-bold outline-none focus:border-brand/50 transition-colors min-w-0"
                  value={formData.barcode || ''}
                  onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                  placeholder="Escanea o escribe"
                />
                <Button 
                  variant="secondary" 
                  type="button" 
                  onClick={() => {
                    let newBarcode = '';
                    let exists = true;
                    while(exists) {
                      const prefix = '200';
                      const random9 = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
                      const base12 = prefix + random9;
                      let sum = 0;
                      for (let i = 0; i < 12; i++) {
                        sum += parseInt(base12[i]) * (i % 2 === 0 ? 1 : 3);
                      }
                      const checksum = (10 - (sum % 10)) % 10;
                      newBarcode = base12 + checksum;
                      exists = products.some(p => p.barcode === newBarcode);
                    }
                    setFormData({...formData, barcode: newBarcode});
                  }}
                  title="Generar EAN-13 automático"
                >
                  Generar
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-black text-text-main uppercase tracking-widest ml-1">Categoría</label>
              <div className="flex gap-2">
                {!isAddingCategory ? (
                  <>
                    <select
                      className="flex-1 bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-text-main font-bold outline-none"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      {categories.filter(c => c !== 'Todos').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {user?.role === 'admin' && (
                      <Button variant="secondary" type="button" onClick={() => { setIsAddingCategory(true); setFormData({...formData, category: ''}) }}>
                        + Nueva
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      className="flex-1 bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-text-main font-bold outline-none"
                      placeholder="Escribe la nueva categoría"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      autoFocus
                    />
                    <Button variant="secondary" type="button" onClick={() => { setIsAddingCategory(false); setFormData({...formData, category: categories.filter(c => c !== 'Todos')[0] || 'General'}) }}>
                      <X size={20} />
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <Input label={formData.is_bulk ? "Precio Venta (por Kg)" : "Precio Venta"} type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
            <Input label={formData.is_bulk ? "Costo (por Kg)" : "Costo"} type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} />
            
            <Input label={formData.is_bulk ? "Stock Actual (Kg)" : "Stock Actual"} type="number" step="0.001" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} required />
            <Input label={formData.is_bulk ? "Stock Mínimo (Kg)" : "Stock Mínimo"} type="number" step="0.001" value={formData.min_stock} onChange={(e) => setFormData({...formData, min_stock: e.target.value})} />

            {formData.is_bulk && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="md:col-span-2 p-6 bg-amber-500/5 rounded-3xl border-2 border-dashed border-amber-500/20 space-y-4"
              >
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Box size={16} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Gestión de Bultos Cerrados</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input 
                    label="Bultos en Almacén" 
                    type="number" 
                    value={formData.bulto_stock} 
                    onChange={(e) => setFormData({...formData, bulto_stock: e.target.value})}
                  />
                  <Input 
                    label="Peso por Bulto (Kg)" 
                    type="number" 
                    step="0.001"
                    value={formData.bulto_weight} 
                    onChange={(e) => {
                      const bw = parseFloat(e.target.value) || 0;
                      const bc = parseFloat(formData.bulto_cost) || 0;
                      const unitCost = bw > 0 && bc > 0 ? (bc / bw).toFixed(2) : formData.cost;
                      setFormData({...formData, bulto_weight: e.target.value, cost: unitCost});
                    }}
                  />
                  <Input 
                    label="Costo del Bulto ($)" 
                    type="number" 
                    step="0.01"
                    placeholder="Calcula el costo/Kg"
                    value={formData.bulto_cost || ''} 
                    onChange={(e) => {
                      const bc = parseFloat(e.target.value) || 0;
                      const bw = parseFloat(formData.bulto_weight) || 0;
                      const unitCost = bw > 0 && bc > 0 ? (bc / bw).toFixed(2) : formData.cost;
                      setFormData({...formData, bulto_cost: e.target.value, cost: unitCost});
                    }}
                  />
                </div>
                <p className="text-[9px] text-amber-600/60 font-medium italic">
                  * Al "abrir" un bulto desde la tabla, se restará uno del almacén y se sumará su peso al stock actual. El Costo del Bulto calculará automáticamente el Costo por Kg.
                </p>
              </motion.div>
            )}

            {/* SECCIÓN DE PROMOCIONES */}
            <div className="md:col-span-2 p-6 bg-brand/5 rounded-3xl border-2 border-brand/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand">
                  <Box size={16} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Promociones y Descuentos</h4>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-bold text-text-muted">Activar Promo</span>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-brand"
                    checked={formData.promo_active}
                    onChange={(e) => setFormData({...formData, promo_active: e.target.checked})}
                  />
                </label>
              </div>

              <AnimatePresence>
                {formData.promo_active && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 overflow-hidden"
                  >
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-black text-text-main uppercase tracking-widest ml-1">Tipo de Promo</label>
                      <select
                        className="bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-text-main font-bold outline-none"
                        value={formData.promo_type}
                        onChange={(e) => setFormData({...formData, promo_type: e.target.value})}
                      >
                        <option value="bundle">Arma tu Paquete (Ej. 2x25)</option>
                        <option value="percent">Descuento (%)</option>
                        <option value="fixed">Descuento Fijo ($)</option>
                      </select>
                    </div>

                    <Input 
                      label={formData.promo_type === 'bundle' ? "Cantidad Mínima (Ej. 2)" : "Cantidad Mínima (opcional)"}
                      type="number"
                      value={formData.promo_min_quantity}
                      onChange={(e) => setFormData({...formData, promo_min_quantity: e.target.value})}
                    />

                    <Input 
                      label={formData.promo_type === 'bundle' ? "Precio Especial Total ($25)" : (formData.promo_type === 'percent' ? "Porcentaje a Descontar (%)" : "Monto a Descontar ($)")}
                      type="number"
                      step="0.01"
                      value={formData.promo_discount}
                      onChange={(e) => setFormData({...formData, promo_discount: e.target.value})}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        label="Inicia (opcional)" 
                        type="date" 
                        value={formData.promo_start_date}
                        onChange={(e) => setFormData({...formData, promo_start_date: e.target.value})}
                      />
                      <Input 
                        label="Expira (opcional)" 
                        type="date" 
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1">Guardar Producto</Button>
          </div>
        </form>
      </Modal>

      <BarcodeCameraScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(text) => {
          const product = products.find(p => p.barcode === text);
          if (product) {
            handleOpenModal(product);
            addNotification('Producto encontrado. Puedes actualizar su stock.', 'info');
          } else {
            handleOpenModal(null);
            setFormData(prev => ({ ...prev, barcode: text }));
            addNotification('Código nuevo detectado. Completa los datos.', 'success');
          }
        }}
      />

      {showPrinter && (
        <BarcodeLabelPrinter 
          products={productsToPrint} 
          onClose={() => setShowPrinter(false)} 
        />
      )}
    </PageWrapper>
  )
}

export default Inventory
