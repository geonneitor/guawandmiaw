# 🏗️ Guaw & Miaw Premium Management System - Architecture

Este documento es el **Manual de Identidad Técnica** del proyecto. Cualquier modificación futura debe adherirse a estas especificaciones.

---

## 🎨 1. Sistema de Diseño: "Zen Monochromatic"
El diseño no es negociable. Busca una estética **Densa, Limpia y Profesional**.

- **Radio de Bordes:** `12px` constante en todos los contenedores y botones.
- **Tipografía:** Sans-serif (Inter/Outfit preferido) con jerarquía clara.
- **Sombras:** `subtle-dark-shadow` para elevación sin ensuciar.
- **Inputs:** Altura fija de `40px` para consistencia.
- **Grillas:** Uso intensivo de Flexbox y CSS Grid para adaptabilidad.
- **Responsive:** Mobile-first, pero optimizado para tablets de 10" (uso común en mostrador).

## 💻 2. Stack Tecnológico
- **Backend:** Flask (Python 3.10+).
- **Base de Datos:** SQLite (`backend/guaw_miaw.db`).
- **Frontend:** SPA (Single Page Application) usando Vanilla JS Modules. No React, No Vue.
- **PDF Gen:** `jspdf` y `jspdf-autotable`.

## ⚙️ 3. Lógica Crítica (Core Logic)

### A. Productos "Granel" (Bulk)
Un producto con `is_bulk: 1` activa el modal de pesaje en el carrito.
- **Conversión:** `Precio_Base * Cantidad (kg) = Total`.
- **Inversa:** Si se ingresa "Monto en Dinero", se calcula la cantidad física inmediatamente.
- **Backend:** Almacena decimales con precisión de 3 dígitos para gramos.

### B. Corte de Caja (Registers)
El flujo es lineal y obligatorio:
1. **Apertura:** Se registra efectivo inicial.
2. **Operación:** Todas las ventas afectan `sales_log`.
3. **Cierre:** Usuario ingresa efectivo físico final.
4. **Validación:** `Fisico - (Inicial + VentasEfectivo - Gastos) = Diferencia`.
5. **Comentario:** Si hay diferencia, el campo de comentario es **obligatorio**.

## 📁 4. Mapa del Tesoro (Directorio)
- `/backend/app.py`: Factoría de la aplicación y configuración de CORS.
- `/backend/routes/`: Cada entidad (pos, inventory, expenses) tiene su propio Blueprint.
- `/frontend/index.html`: Shell principal. Usa un sistema de "Tab Switching" ocultando/mostrando divs.
- `/frontend/static/style.css`: Contiene la "Biblia" de estilos. Modificar con precaución las variables `:root`.

## ⚠️ 5. Reglas de Oro para Desarrollo Futuro
1. **No Duplicar Datos:** Siempre consulta el `backend` para totales de inventario; no confíes solo en el estado del frontend tras recargar.
2. **Chart.js:** Mantén el wrapper `position: relative` para evitar que el canvas crezca infinitamente.
3. **Modales:** Todos los modales deben seguir la clase `.zen-modal` para mantener la estética.
4. **Backups:** Antes de una migración de DB, copiar `guaw_miaw.db` a `guaw_miaw.db.bak`.

---
*Este documento debe ser actualizado cada vez que se agregue un módulo mayor.*
