import React, { useState, useEffect, useMemo } from 'react'
import { Users, Plus, Search, Mail, Phone, ExternalLink, MapPin, Trash2, Edit3, X } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import Card from '../design-system/components/Card'
import Button from '../design-system/components/Button'
import Avatar from '../components/Avatar'
import Badge from '../design-system/components/Badge'
import Modal from '../design-system/components/Modal'
import Input from '../design-system/components/Input'
import { useNotificationStore } from '../store/useNotificationStore'
import { clientsApi } from '../api/clients'

const Clients = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const { addNotification } = useNotificationStore()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    loyalty_points: 0
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    setLoading(true)
    try {
      const res = await clientsApi.getClients()
      if (res.success) setClients(res.data)
    } catch (err) {
      addNotification('Error al cargar clientes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client)
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        loyalty_points: client.loyalty_points || 0
      })
    } else {
      setEditingClient(null)
      setFormData({ name: '', email: '', phone: '', address: '', loyalty_points: 0 })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let res
      if (editingClient) {
        res = await clientsApi.updateClient(editingClient.id, formData)
      } else {
        res = await clientsApi.createClient(formData)
      }
      if (res.success) {
        addNotification(editingClient ? 'Cliente actualizado' : 'Cliente creado', 'success')
        setIsModalOpen(false)
        fetchClients()
      }
    } catch (err) {
      addNotification('Error al guardar cliente', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        const res = await clientsApi.deleteClient(id)
        if (res.success) {
          addNotification('Cliente eliminado', 'success')
          fetchClients()
        }
      } catch (err) {
        addNotification('Error al eliminar', 'error')
      }
    }
  }

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search))
    )
  }, [search, clients])

  return (
    <PageWrapper className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-brand uppercase tracking-tighter">Directorio de Clientes</h1>
          <p className="text-text-muted font-medium">Gestiona tu base de clientes y puntos de fidelidad</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>Nuevo Cliente</Button>
      </div>

      <Card className="p-4" padding="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, correo o teléfono..."
            className="w-full pl-12 pr-4 py-3 bg-bg-main rounded-2xl outline-none font-bold text-text-main"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand">
              <X size={20} />
            </button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading && clients.length === 0 ? (
          <div className="col-span-full py-20 text-center">
             <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-4" />
             <p className="font-bold text-text-muted">Cargando clientes...</p>
          </div>
        ) : (
          <>
            {filteredClients.map((client) => (
              <Card key={client.id} className="p-6 flex flex-col gap-4 group" hover>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <Avatar name={client.name} size="lg" />
                    <div>
                      <h3 className="font-black text-text-main text-lg leading-tight">{client.name}</h3>
                      <Badge variant={client.loyalty_points > 1000 ? 'success' : 'info'} size="sm" className="mt-1">
                        {client.loyalty_points > 1000 ? 'VIP Member' : 'Cliente Frecuente'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(client)} className="p-2 text-text-muted hover:text-brand transition-colors">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="p-2 text-text-muted hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mt-2">
                  {client.email && (
                    <div className="flex items-center gap-3 text-sm text-text-muted font-medium">
                      <Mail size={14} className="text-brand" /> {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-3 text-sm text-text-muted font-medium">
                      <Phone size={14} className="text-brand" /> {client.phone}
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-3 text-sm text-text-muted font-medium truncate">
                      <MapPin size={14} className="text-brand" /> {client.address}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border-subtle">
                  <div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Puntos</p>
                    <p className="text-xl font-black text-brand">{client.loyalty_points}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Registrado</p>
                    <p className="text-sm font-black text-text-main mt-1">
                      {new Date(client.created_at).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            
            {filteredClients.length === 0 && (
              <div className="col-span-full py-20 text-center text-text-muted italic border-2 border-dashed border-border-subtle rounded-[2rem]">
                No se encontraron clientes que coincidan con la búsqueda.
              </div>
            )}
          </>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Input 
            label="Nombre Completo" 
            placeholder="Ej. Juan Pérez" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Correo Electrónico" 
              type="email"
              placeholder="juan@ejemplo.com" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <Input 
              label="Teléfono" 
              placeholder="55 1234 5678" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <Input 
            label="Dirección" 
            placeholder="Calle, Número, Colonia..." 
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
          <Input 
            label="Puntos de Fidelidad" 
            type="number"
            value={formData.loyalty_points}
            onChange={(e) => setFormData({...formData, loyalty_points: parseInt(e.target.value) || 0})}
          />
          <div className="pt-4 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1">Guardar Cliente</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  )
}

export default Clients
