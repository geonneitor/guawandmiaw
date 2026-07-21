import React, { useState, useEffect } from 'react'
import { UserPlus, Shield, Key, Trash2, Mail, CheckCircle2, XCircle } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import Card from '../design-system/components/Card'
import Button from '../design-system/components/Button'
import Avatar from '../components/Avatar'
import Badge from '../design-system/components/Badge'
import Modal from '../design-system/components/Modal'
import Input from '../design-system/components/Input'
import { useNotificationStore } from '../store/useNotificationStore'
import { authApi } from '../api/auth'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({ username: '', password: '', role: 'cajero', display_name: '' })
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await authApi.getUsers()
      if (res.success) setUsers(res.data)
    } catch (err) {
      addNotification('Error al cargar usuarios. Asegúrate de tener permisos de administrador.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Administrador',
      encargado: 'Encargado',
      cajero: 'Cajero',
      'vendedor-caja': 'Vendedor'
    }
    return roles[role] || role
  }

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({ username: user.username, role: user.role, display_name: user.display_name || '', password: '' })
    } else {
      setEditingUser(null)
      setFormData({ username: '', password: '', role: 'cajero', display_name: '' })
    }
    setIsModalOpen(true)
  }

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        const res = await authApi.updateUser(editingUser.id, formData)
        if (res.success) addNotification('Usuario actualizado', 'success')
      } else {
        const res = await authApi.createUser(formData)
        if (res.success) addNotification('Usuario creado', 'success')
      }
      setIsModalOpen(false)
      fetchUsers()
    } catch (err) {
      addNotification('Error al guardar usuario', 'error')
    }
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return
    try {
      const res = await authApi.deleteUser(id)
      if (res.success) {
        addNotification('Usuario eliminado', 'success')
        fetchUsers()
      }
    } catch (err) {
      addNotification('Error al eliminar usuario', 'error')
    }
  }

  return (
    <PageWrapper className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-sans font-extrabold tracking-tight text-brand">Equipo de Trabajo</h1>
          <p className="text-text-muted font-medium">Gestiona los accesos y perfiles de tus colaboradores</p>
        </div>
        <Button icon={UserPlus} onClick={() => handleOpenModal()}>Nuevo Usuario</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && users.length === 0 ? (
          <div className="col-span-full py-20 text-center">
             <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-4" />
             <p className="font-bold text-text-muted">Cargando equipo...</p>
          </div>
        ) : (
          <>
            {users.map((user) => (
              <Card key={user.id} className="p-6 relative group" hover>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative shrink-0">
                    <Avatar name={user.display_name || user.username} size="lg" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-bg-card ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-sans font-extrabold tracking-tight text-text-main text-xl leading-tight truncate" title={user.display_name || user.username}>{user.display_name || user.username}</h3>
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest truncate">{getRoleLabel(user.role)}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border-subtle">
                  <div className="flex items-center gap-2 text-sm text-text-muted font-medium truncate">
                    <Mail size={14} className="text-brand shrink-0" /> <span className="truncate">{user.username}@guawmiaw.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-muted font-medium">
                    <Shield size={14} className="text-brand" /> 
                    Estado: {user.is_active ? 'Activo' : 'Inactivo'}
                  </div>
                  {user.last_login && (
                    <div className="flex items-center gap-2 text-[10px] text-text-muted font-bold uppercase tracking-widest">
                       Último acceso: {new Date(user.last_login).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-6">
                  <Button variant="outline" className="flex-1" size="sm" icon={Key} onClick={() => handleOpenModal(user)}>Editar</Button>
                  <Button variant="secondary" className="px-4" size="sm" icon={Trash2} onClick={() => handleDeleteUser(user.id)} />
                </div>
              </Card>
            ))}

            {users.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center text-text-muted italic border-2 border-dashed border-border-subtle rounded-[2rem]">
                No tienes permisos para ver esta sección o no hay usuarios registrados.
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <div className="space-y-4 pt-4">
          <Input label="Usuario (Login)" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} disabled={!!editingUser} />
          <Input label="Nombre a mostrar" value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-muted uppercase">Rol</label>
            <select className="bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-text-main font-bold outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="admin">Administrador</option>
              <option value="encargado">Encargado</option>
              <option value="cajero">Cajero</option>
              <option value="vendedor-caja">Vendedor</option>
            </select>
          </div>
          <Input label={editingUser ? "Nuevo PIN/Contraseña (opcional)" : "PIN/Contraseña"} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <Button className="w-full mt-4" onClick={handleSaveUser}>Guardar Usuario</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}

export default Users
