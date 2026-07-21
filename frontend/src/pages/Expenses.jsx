import React, { useState, useEffect, useMemo } from 'react'
import { Receipt, Plus, Search, Calendar, Trash2, TrendingDown, X } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import Card from '../design-system/components/Card'
import Button from '../design-system/components/Button'
import Badge from '../design-system/components/Badge'
import Modal from '../design-system/components/Modal'
import Input from '../design-system/components/Input'
import { useNotificationStore } from '../store/useNotificationStore'
import { expensesApi } from '../api/expenses'

const Expenses = () => {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  })

  const { addNotification } = useNotificationStore()

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const res = await expensesApi.getExpenses()
      if (res.success) setExpenses(res.data)
    } catch (err) {
      addNotification('Error al cargar gastos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await expensesApi.createExpense(formData)
      if (res.success) {
        addNotification('Gasto registrado', 'success')
        setIsModalOpen(false)
        setFormData({ description: '', amount: '', date: new Date().toISOString().split('T')[0] })
        fetchExpenses()
      }
    } catch (err) {
      addNotification('Error al registrar gasto', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este gasto?')) {
      try {
        const res = await expensesApi.deleteExpense(id)
        if (res.success) {
          addNotification('Gasto eliminado', 'success')
          fetchExpenses()
        }
      } catch (err) {
        addNotification('Error al eliminar', 'error')
      }
    }
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase())
      const matchesDate = !dateFilter || e.date.startsWith(dateFilter)
      return matchesSearch && matchesDate
    })
  }, [search, dateFilter, expenses])

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0)
  }, [filteredExpenses])

  return (
    <PageWrapper className="flex flex-col gap-6">
      <div className="flex flex-col md:items-center md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-brand uppercase tracking-tighter">Gastos y Salidas</h1>
          <p className="text-text-muted font-medium">Registro de egresos y pagos operativos</p>
        </div>
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>Registrar Gasto</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden" padding="p-0">
          <div className="p-4 border-b border-border-subtle bg-bg-main flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por concepto..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-bg-card rounded-xl outline-none font-bold text-sm text-text-main border border-border-subtle"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <input 
                  type="date"
                  className="pl-9 pr-3 py-2 bg-white dark:bg-bg-card rounded-xl outline-none font-bold text-xs text-text-main border border-border-subtle w-full"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              {dateFilter && (
                <button 
                  onClick={() => setDateFilter('')}
                  className="p-2 text-text-muted hover:text-red-500"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg-main/50 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">
                  <th className="px-6 py-4">Concepto</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Monto</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-text-main">{exp.description}</p>
                      <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Operativo</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-text-muted">
                      {new Date(exp.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-black text-red-500">-${exp.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(exp.id)}
                        className="p-2 text-text-muted hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && !loading && (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-text-muted italic text-sm">
                      No hay gastos que coincidan con los filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="bg-brand text-white p-8 soft-shadow border-none" padding="p-8">
            <h3 className="font-black uppercase tracking-tighter opacity-80 mb-2">Total Filtrado</h3>
            <p className="text-4xl font-black">${totalAmount.toFixed(2)}</p>
            <div className="mt-6 pt-6 border-t border-white/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <TrendingDown size={20} />
              </div>
              <p className="text-xs font-bold leading-tight">Representa el total de egresos operativos para el periodo seleccionado.</p>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-black text-sm uppercase tracking-widest mb-4 text-text-main">Información</h3>
            <div className="space-y-3">
              <p className="text-xs text-text-muted leading-relaxed">
                Recuerda que todos los gastos registrados aquí afectan directamente al balance del corte de caja si se realizan durante el turno activo.
              </p>
              <Button variant="secondary" className="w-full" icon={Receipt}>Exportar Gastos</Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Gasto Operativo">
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Input 
            label="Concepto / Descripción" 
            placeholder="Ej. Pago de luz, Artículos de limpieza..." 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
            autoFocus
          />
          <Input 
            label="Monto ($)" 
            type="number" 
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            required
          />
          <Input 
            label="Fecha" 
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
          <div className="pt-4 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1">Guardar Gasto</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  )
}

export default Expenses
