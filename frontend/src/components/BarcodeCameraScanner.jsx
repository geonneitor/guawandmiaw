import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Modal from '../design-system/components/Modal';

const BarcodeCameraScanner = ({ isOpen, onClose, onScan, title = "Escanear Código" }) => {
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode;
    
    if (isOpen) {
      setError('');
      // Damos un pequeño timeout para asegurar que el div del modal ya esté montado en el DOM
      const timer = setTimeout(() => {
        html5QrCode = new Html5Qrcode("camera-reader");
        
        const config = { fps: 10, qrbox: { width: 250, height: 150 } };
        
        html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            onScan(decodedText);
            onClose(); // Automatically close after successful scan
          },
          (errorMessage) => {
            // ignore constant read errors when no barcode is present
          }
        ).catch((err) => {
          console.error("Camera Error: ", err);
          setError('No se pudo acceder a la cámara. Verifica los permisos o asegúrate de usar HTTPS/localhost.');
        });
        
        scannerRef.current = html5QrCode;
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
          }).catch(e => console.error("Error stopping camera", e));
        }
      };
    }
  }, [isOpen, onScan, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center justify-center py-4">
        {error ? (
          <div className="text-red-500 font-bold text-center bg-red-50 p-4 rounded-xl border border-red-200">
            {error}
          </div>
        ) : (
          <>
            <div id="camera-reader" className="w-full max-w-sm rounded-2xl overflow-hidden border-2 border-brand/20 shadow-lg bg-black min-h-[250px]">
              {/* html5-qrcode will render the video here */}
            </div>
            <p className="text-[10px] text-text-muted mt-4 font-black uppercase tracking-widest text-center">
              Apunta la cámara trasera al código de barras
            </p>
          </>
        )}
      </div>
    </Modal>
  );
};

export default BarcodeCameraScanner;
