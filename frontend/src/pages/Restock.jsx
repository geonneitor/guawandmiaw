import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { api } from '../api/client';

const Restock = ({ isTab }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products')
      ]);
      if (supRes.success) setSuppliers(supRes.data);
      if (prodRes.success) setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  ).slice(0, 10); // Show max 10 to keep it clean

  const addToCart = (product) => {
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      if (product.is_bulk) {
        setCart(cart.map(i => i.product_id === product.id ? { ...i, bultos: i.bultos + 1, quantity: i.quantity + 1 } : i));
      } else {
        setCart(cart.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
    } else {
      if (product.is_bulk) {
        const defaultWeight = product.bulto_weight || 20;
        const defaultBultoCost = (product.cost || 0) * defaultWeight;
        setCart([...cart, {
          product_id: product.id,
          name: product.name,
          is_bulk_restock: true,
          bultos: 1,
          bulto_weight: defaultWeight,
          quantity: 1, // represents bultos in request
          unit_cost: defaultBultoCost
        }]);
      } else {
        setCart([...cart, {
          product_id: product.id,
          name: product.name,
          quantity: 1,
          unit_cost: product.cost
        }]);
      }
    }
    setSearchTerm(''); // clear search after adding
  };

  const updateCartItem = (id, field, value) => {
    setCart(cart.map(i => {
      if (i.product_id === id) {
        const updatedVal = Number(value);
        if (field === 'bultos') {
          return { ...i, bultos: updatedVal, quantity: updatedVal };
        }
        return { ...i, [field]: updatedVal };
      }
      return i;
    }));
  };

  const removeCartItem = (id) => {
    setCart(cart.filter(i => i.product_id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedSupplier) return alert('Selecciona un proveedor');
    if (cart.length === 0) return alert('Agrega al menos un producto');

    setLoading(true);
    try {
      const res = await api.post('/inventory/restock', {
        supplier_id: selectedSupplier,
        items: cart,
        notes
      });
      if (res.success) {
        alert('Resurtido exitoso');
        setCart([]);
        setNotes('');
        setSelectedSupplier('');
        fetchData(); // refresh product stock
      } else {
        alert('Error: ' + res.error);
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = cart.reduce((acc, curr) => {
    if (curr.is_bulk_restock) {
      return acc + (curr.bultos * curr.unit_cost);
    }
    return acc + (curr.quantity * curr.unit_cost);
  }, 0);

  const Wrapper = isTab ? 'div' : PageWrapper;

  return (
    <Wrapper className={isTab ? "flex flex-col md:flex-row gap-6 h-auto md:h-[calc(100vh-140px)]" : "flex flex-col md:flex-row gap-6 h-auto md:h-[calc(100vh-80px)]"}>
      {/* Columna Izquierda: Búsqueda y Selección */}
      <div className="w-full md:w-1/2 flex flex-col gap-4">
        <div className="bg-bg-panel p-6 rounded-2xl soft-shadow">
          <h2 className="text-2xl font-bold text-brand mb-4">🛒 Orden de Resurtido</h2>
          
          <label className="block text-sm font-bold text-text-muted mb-2">Proveedor</label>
          <select 
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full bg-bg-main border border-border-color rounded-xl p-3 text-text-main focus:outline-none focus:border-brand mb-4"
          >
            <option value="">-- Seleccionar Proveedor --</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <label className="block text-sm font-bold text-text-muted mb-2">Buscar Producto (Nombre o SKU)</label>
          <input 
            type="text" 
            placeholder="Ej. Croquetas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-main border border-border-color rounded-xl p-3 text-text-main focus:outline-none focus:border-brand"
          />
        </div>

        {searchTerm && (
          <div className="bg-bg-panel p-4 rounded-2xl soft-shadow overflow-y-auto flex-1">
            <h3 className="text-sm font-bold text-text-muted mb-3">Resultados ({filteredProducts.length})</h3>
            <div className="flex flex-col gap-2">
              {filteredProducts.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-bg-main rounded-xl border border-border-color hover:border-brand/50 transition-colors cursor-pointer" onClick={() => addToCart(p)}>
                  <div>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-xs text-text-muted">Stock actual: {p.stock} | Costo: ${p.cost}</div>
                  </div>
                  <div className="text-brand text-xl font-bold">+</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Columna Derecha: Carrito y Check */}
      <div className="w-full md:w-1/2 bg-bg-panel p-6 rounded-2xl soft-shadow flex flex-col">
        <h2 className="text-xl font-bold mb-4 border-b border-border-color pb-4">Artículos a Ingresar</h2>
        
        <div className="flex-1 overflow-y-auto flex flex-col gap-3">
          {cart.length === 0 ? (
            <div className="text-center text-text-muted my-auto opacity-50">
              <div className="text-4xl mb-2">📦</div>
              Agrega productos para resurtir
            </div>
          ) : (
            cart.map(item => {
              if (item.is_bulk_restock) {
                return (
                  <div key={item.product_id} className="bg-bg-main p-4 rounded-xl border border-border-color flex flex-col gap-2 border-l-4 border-l-amber-500">
                    <div className="flex justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        📦 {item.name} <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">A Granel</span>
                      </span>
                      <button onClick={() => removeCartItem(item.product_id)} className="text-red-500 hover:text-red-700">✕</button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 items-center">
                      <div>
                        <label className="text-[10px] text-text-muted block font-bold mb-1">Bultos</label>
                        <input 
                          type="number" min="1" step="1"
                          value={item.bultos}
                          onChange={(e) => updateCartItem(item.product_id, 'bultos', e.target.value)}
                          className="w-full bg-bg-panel border border-border-color rounded p-2 text-xs font-bold focus:border-brand"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-muted block font-bold mb-1">Kg x Bulto</label>
                        <input 
                          type="number" min="0.01" step="any"
                          value={item.bulto_weight}
                          onChange={(e) => updateCartItem(item.product_id, 'bulto_weight', e.target.value)}
                          className="w-full bg-bg-panel border border-border-color rounded p-2 text-xs font-bold focus:border-brand"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-muted block font-bold mb-1">Costo x Bulto ($)</label>
                        <input 
                          type="number" min="0" step="any"
                          value={item.unit_cost}
                          onChange={(e) => updateCartItem(item.product_id, 'unit_cost', e.target.value)}
                          className="w-full bg-bg-panel border border-border-color rounded p-2 text-xs font-bold focus:border-brand"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border-color/30 text-xs font-bold">
                      <span className="text-text-muted">Equivale a: {(item.bultos * item.bulto_weight).toFixed(1)} Kg</span>
                      <span className="text-brand text-sm font-black">Subtotal: ${(item.bultos * item.unit_cost).toFixed(2)}</span>
                    </div>
                  </div>
                )
              }

              return (
                <div key={item.product_id} className="bg-bg-main p-4 rounded-xl border border-border-color flex flex-col gap-2">
                  <div className="flex justify-between font-bold">
                    <span>{item.name}</span>
                    <button onClick={() => removeCartItem(item.product_id)} className="text-red-500 hover:text-red-700">✕</button>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <label className="text-xs text-text-muted block">Cantidad (Entrada)</label>
                      <input 
                        type="number" min="0.01" step="any"
                        value={item.quantity}
                        onChange={(e) => updateCartItem(item.product_id, 'quantity', e.target.value)}
                        className="w-full bg-bg-panel border border-border-color rounded p-2 text-sm focus:border-brand"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-text-muted block">Costo Unitario ($)</label>
                      <input 
                        type="number" min="0" step="any"
                        value={item.unit_cost}
                        onChange={(e) => updateCartItem(item.product_id, 'unit_cost', e.target.value)}
                        className="w-full bg-bg-panel border border-border-color rounded p-2 text-sm focus:border-brand"
                      />
                    </div>
                    <div className="flex-1 text-right pt-4 font-bold text-brand">
                      ${(item.quantity * item.unit_cost).toFixed(2)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border-color">
          <label className="block text-sm font-bold text-text-muted mb-2">Notas (Opcional)</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-bg-main border border-border-color rounded-xl p-3 text-sm focus:border-brand mb-4 resize-none h-20"
            placeholder="Referencia de factura, comentarios..."
          />
          
          <div className="flex justify-between items-end mb-4">
            <div className="text-sm text-text-muted">Total Estimado</div>
            <div className="text-3xl font-black text-brand">${totalCost.toFixed(2)}</div>
          </div>
          
          <button 
            onClick={handleSubmit} 
            disabled={loading || cart.length === 0 || !selectedSupplier}
            className="w-full py-4 rounded-xl font-bold bg-brand text-white hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : 'Confirmar Resurtido'}
          </button>
        </div>
      </div>
    </Wrapper>
  );
};

export default Restock;
