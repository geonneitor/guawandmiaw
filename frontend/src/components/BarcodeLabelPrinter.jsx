import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Barcode from 'react-barcode';

const BarcodeLabelPrinter = ({ products = [], onClose }) => {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: "@page { size: auto; margin: 5mm; }"
  });

  if (!products || products.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-bg-panel rounded-2xl w-full max-w-2xl overflow-hidden soft-shadow flex flex-col">
        <div className="p-4 border-b border-border-color flex justify-between items-center bg-bg-main">
          <h2 className="text-xl font-bold text-brand flex items-center gap-2">
            <span className="text-2xl">🖨️</span> Imprimir Etiquetas
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-bg-panel rounded-lg text-text-muted transition-colors">
            ✕
          </button>
        </div>

        <div className="p-6 bg-bg-main flex-1 overflow-auto max-h-[60vh]">
          {/* Oculto en pantalla, visible al imprimir */}
          <div ref={componentRef} className="print-container bg-white p-4">
            <style>{`
              @media print {
                .print-container { padding: 0 !important; margin: 0 !important; background: white !important; }
                .label-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                .label-item { 
                  border: 1px dashed #ccc; 
                  padding: 10px; 
                  text-align: center; 
                  page-break-inside: avoid;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  font-family: sans-serif;
                }
                .label-name { font-size: 12px; font-weight: bold; margin-bottom: 4px; max-height: 30px; overflow: hidden; }
                .label-price { font-size: 14px; font-weight: 900; margin-bottom: 4px; }
                body { background: white; }
              }
            `}</style>
            
            <div className="label-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p, idx) => (
                <div key={idx} className="label-item border p-4 rounded bg-white text-black flex flex-col items-center">
                  <div className="label-name text-sm font-bold text-center line-clamp-2 mb-1">{p.name}</div>
                  <div className="label-price text-lg font-black mb-2">${p.price}</div>
                  {p.barcode ? (
                    <Barcode value={p.barcode} width={1.5} height={40} fontSize={12} displayValue={true} />
                  ) : (
                    <div className="text-xs text-gray-400 italic mt-4">Sin código</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border-color bg-bg-panel flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-text-main hover:bg-bg-main transition-colors">
            Cancelar
          </button>
          <button onClick={handlePrint} className="px-6 py-2 rounded-xl bg-brand text-white font-bold hover:bg-brand-light transition-colors soft-shadow">
            Imprimir {products.length} {products.length === 1 ? 'Etiqueta' : 'Etiquetas'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeLabelPrinter;
