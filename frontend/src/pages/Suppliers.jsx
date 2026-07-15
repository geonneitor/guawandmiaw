import React, { useState, useEffect, useMemo } from 'react'
import { Truck, Plus, Search, MapPin, Package, Phone, Mail, Trash2, Edit3, X, Globe } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import Card from '../design-system/components/Card'
import Button from '../design-system/components/Button'
import Modal from '../design-system/components/Modal'
import Input from '../design-system/components/Input'
import { useNotificationStore } from '../store/useNotificationStore'
import { inventoryApi } from '../api/inventory'

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const { addNotification } = useNotificationStore()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    contact_info: ''
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const res = await inventoryApi.getSuppliers()
      if (res.success) setSuppliers(res.data)
    } catch (err) {
      addNotification('Error al cargar proveedores', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        name: supplier.name || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        notes: supplier.notes || '',
        contact_info: supplier.contact_info || ''
      })
    } else {
      setEditingSupplier(null)
      setFormData({ name: '', phone: '', email: '', notes: '', contact_info: '' })
    }
    setIsModalOpen(true)
  }

  const handleSaveSupplier = async () => {
    try {
      if (editingSupplier) {
        const res = await inventoryApi.updateSupplier(editingSupplier.id, formData)
        if (res.success) addNotification('Proveedor actualizado', 'success')
      } else {
        const res = await inventoryApi.createSupplier(formData)
        if (res.success) addNotification('Proveedor creado', 'success')
      }
      setIsModalOpen(false)
      fetchSuppliers()
    } catch (err) {
      addNotification('Error al guardar proveedor', 'error')
    }
  }

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este proveedor?')) return
    try {
      const res = await inventoryApi.deleteSupplier(id)
      if (res.success) {
        addNotification('Proveedor eliminado', 'success')
        fetchSuppliers()
      }
    } catch (err) {
      addNotification('Error al eliminar proveedor', 'error')
    }
  }
  
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.includes(search))
    )
  }, [search, suppliers])

  return (
    <PageWrapper className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-brand uppercase tracking-tighter">Proveedores</h1>
          <p className="text-text-muted font-medium">Gestiona tu red de abastecimiento y compras</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Nuevo Proveedor</Button>
      </div>

      <Card className="p-4" padding="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input 
            type="text" 
            placeholder="Buscar proveedor por nombre, correo o teléfono..."
            className="w-full pl-12 pr-4 py-3 bg-bg-main rounded-2xl outline-none font-bold text-text-main"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && suppliers.length === 0 ? (
          <div className="col-span-full py-20 text-center">
             <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-4" />
             <p className="font-bold text-text-muted">Cargando proveedores...</p>
          </div>
        ) : (
          <>
            {filteredSuppliers.map((sup) => (
              <Card key={sup.id} className="p-6 space-y-4 group" hover>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                      <Truck size={32} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-text-main leading-tight">{sup.name}</h3>
                      <p className="text-[10px] font-black text-brand uppercase tracking-widest">Proveedor</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(sup)} className="p-2 text-text-muted hover:text-brand transition-colors">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDeleteSupplier(sup.id)} className="p-2 text-text-muted hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  {sup.phone && (
                    <div className="flex items-center gap-2 text-sm text-text-muted font-medium">
                      <Phone size={14} className="text-brand" /> {sup.phone}
                    </div>
                  )}
                  {sup.email && (
                    <div className="flex items-center gap-2 text-sm text-text-muted font-medium">
                      <Mail size={14} className="text-brand" /> {sup.email}
                    </div>
                  )}
                  {sup.contact_info && (
                    <div className="flex items-center gap-2 text-sm text-text-muted font-medium">
                      <Globe size={14} className="text-brand" /> {sup.contact_info}
                    </div>
                  )}
                </div>

                {sup.notes && (
                  <p className="text-xs text-text-muted italic line-clamp-2 bg-bg-main p-2 rounded-xl border border-border-subtle">
                    "{sup.notes}"
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" size="sm">Ver Catálogo</Button>
                </div>
              </Card>
            ))}
            
            {filteredSuppliers.length === 0 && (
              <div className="col-span-full py-20 text-center text-text-muted italic border-2 border-dashed border-border-subtle rounded-[2rem]">
                No se encontraron proveedores.
              </div>
            )}
          </>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      >
        <div className="p-4 bg-brand/5 rounded-2xl border border-brand/10 mb-4">
           <p className="text-xs text-brand font-bold">Esta sección permite gestionar los datos de contacto de tus proveedores.</p>
        </div>
        {/* Placeholder for form submission as I need to update API first */}
        <div className="space-y-4">
           <Input label="Nombre del Proveedor" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
           <div className="grid grid-cols-2 gap-4">
              <Input label="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <Input label="Correo" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
           </div>
           <Input label="Sitio Web / Contacto" value={formData.contact_info} onChange={e => setFormData({...formData, contact_info: e.target.value})} />
           <Input label="Notas" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
           <div className="pt-4">
              <Button className="w-full" onClick={handleSaveSupplier}>Guardar Proveedor</Button>
           </div>
        </div>
      </Modal>
    </PageWrapper>
  )
}

export default Suppliers
