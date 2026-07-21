# 🏗️ Guaw & Miaw V3 - Master Architecture & Documentation

Esta es la única fuente de verdad técnica y de diseño para el proyecto Guaw & Miaw V3.

## 1. Topología de la Arquitectura (Desacoplada)
El proyecto está dividido en tres capas principales:

### A. Capa de Presentación (Frontend & PWA)
- **Tecnologías:** React 19, Vite, TailwindCSS, Zustand (estado global).
- **Progressive Web App (PWA):** Soporte total mediante `vite-plugin-pwa`. La app es instalable en iOS/Android y funciona con *Service Worker* para caché (íconos y manifiesto configurados para `mobile-web-app-capable`).
- **Hosting:** **Vercel** (Zero-Config, auto-detecta Vite).
- **Variables de Entorno (Vercel):** `VITE_API_URL` (Apunta a la API de Render).

### B. Capa de Lógica de Negocio (Backend)
- **Tecnologías:** Python 3.11, Flask, Flask-SQLAlchemy, JWT-Extended, Gunicorn.
- **Hosting:** **Render.com** (Web Service).
- **Variables de Entorno (Render):** `DATABASE_URL` (Supabase), `SECRET_KEY`, `JWT_SECRET_KEY`, `FLASK_ENV` (production), `CORS_ORIGINS` (*).

### C. Capa de Persistencia de Datos (Base de Datos)
- **Proveedor:** **Supabase** (PostgreSQL).
- **Conexión:** Se utiliza el Connection Pooler de Supabase (Puerto `6543`) en modo Transaction. La URL en SQLAlchemy usa el prefijo `postgresql://` con `?sslmode=require`.
- **Autenticación:** Gestionada internamente por Flask vía JWT (PIN de 6 dígitos para el cajero), no se usa el sistema de Supabase Auth nativo.

---

## 🎨 2. Sistema de Diseño: "Midnight Rose"
El diseño premium es estrictamente mantenido bajo el tema "Midnight Rose", enfocado en dar un contraste refinado.
- **Brand (Primario):** `#FFB7C5` (Rosa Pastel).
- **Background Main:** `#FDF2F4` (Blanco-Crema suave para evitar fatiga visual).
- **Text Main:** `#1A1A1A` (Alto contraste para lectura).
- **Border Subtle:** `rgba(0, 0, 0, 0.08)`.
- **Componentes Core:**
  - **Cards / Contenedores:** Bordes redondeados consistentes (`2rem` / `12px` de acuerdo a la especificidad del componente) y sombra suave (`subtle-dark-shadow`).
  - **Botones:** Estilo Claymorphism puro (CSS vanilla), las animaciones de Framer Motion se han minimizado para proteger el rendimiento en móviles.
  - **Modales:** Ventanas emergentes con fondo desenfocado (Glassmorphism).

## ⚡ 3. Optimización Móvil y Rendimiento (Mobile First)
Debido a la alta cantidad de productos y operaciones rápidas:
- **Paginación Virtual Ligera:** En `Inventory.jsx` y `POS.jsx` se utiliza `.slice(0, visibleCount)` para limitar la carga inicial del DOM a 40 elementos, previniendo bloqueos del Main Thread (`Forced reflow`) comunes al mapear arrays de cientos de elementos.
- **Vistas Móviles Desacopladas:** 
  - **Inventario:** Las tablas HTML se ocultan en pantallas pequeñas (`hidden md:block`) en favor de **Tarjetas CSS apilables**, evitando el colapso de la información y la saturación.
  - **POS:** Se implementó un "Mobile Tab Switcher" para teléfonos que separa la vista del catálogo de la vista del carrito, dándole espacio de pantalla completo al usuario y facilitando toques precisos sin encoger los botones.

---

## ⚙️ 4. Lógica de Negocio (Core Logic)

### A. Gestión de Inventario a Granel (Bulk)
Para soportar la venta de alimento pesado y bultos completos:
- **Estructura de Datos (Product):** Incluye `is_bulk` (Boolean), `unit` (ej. 'kg', 'gr'), `bulto_stock` (Cantidad de sacos cerrados), `bulto_weight` (Peso que contiene cada saco).
- **Flujo de "Apertura de Bulto":** Al activar "Abrir Bulto", el sistema resta **1** de `bulto_stock` y suma automáticamente el valor de `bulto_weight` al `stock` disponible para venta suelta.
- **Punto de Venta (POS):** Si un producto tiene `is_bulk: 1`, activa el modal de pesaje en el carrito, calculando el total a través de la fórmula `Precio * Cantidad (kg) = Total`.

### B. Corte de Caja (Gestión Financiera)
El flujo protege la integridad de los ingresos de la tienda:
1. **Cerrada:** El POS está bloqueado y no permite procesar ventas.
2. **Abierta:** El cajero inicia sesión registrando un fondo inicial.
3. **Movimientos de Efectivo:** 
   - **Entradas:** Dinero extra que ingresa (ej. para cambio).
   - **Salidas/Retiros:** Retiros para pagos o resguardo.
   - **Gastos Operativos:** Pagos a proveedores que merman el balance final.
4. **Cierre (Corte):** Compara el **Efectivo Esperado** (Fondo + Ventas Efectivo + Entradas - Salidas - Gastos) contra el **Efectivo Real** contado por el cajero. Toda diferencia exige un comentario obligatorio.

---

## 🔒 5. Sistema de Seguridad y Roles
- **Frontend `RoleGuard`:** Un wrapper de React que protege vistas críticas (`/dashboard`, `/inventory`, `/reports`, `/restock`, `/suppliers`, `/clients`, `/sales`, `/expenses`, `/users`) restringiendo el acceso por el `role` alojado en la cookie JWT y en `useAuthStore`.
- **Backend `@require_auth`:** El decorador en Flask valida que el rol del usuario esté dentro del arreglo de roles permitidos para las acciones (POST, PUT, DELETE) sobre `products`, `corte`, `sales`, etc.
- **Modelos:** Se ha asegurado la sincronización del modelo `Product` (ej. se eliminó la columna `location` que causaba conflictos con consultas antiguas).

---

## 🤖 6. Asistente IA (Fígaro & Chila - Agentic AI)
- **Modelos:** Se utiliza `llama-3.3-70b-versatile` de Groq para procesamiento ultrarrápido y generación conversacional.
- **Agentic Capabilities (Tool Calling):** La IA dejó de ser un simple chatbot y ahora funciona como un **Agente** capaz de ejecutar funciones sobre el sistema:
  - `check_inventory(nombre)`: Consulta el stock real en la BD.
  - `open_cash_register(amount)`: Inicia un turno de caja automáticamente desde la BD mediante un comando de chat.
  - `add_to_cart(id, cantidad)`: Intercepta la acción en el frontend mediante eventos para inyectar productos en el `useCartStore` y lanza notificaciones interactivas para que el usuario proceda al pago.
- **Guardrails Dinámicos:** El comportamiento de la IA está controlado en su System Prompt con una `temperature` de `0.1` para respuestas clínicas. Tiene un contexto inyectado (hora exacta, producto más vendido hoy, ventas totales, etc.) para fungir como asistente administrativo, calculadora rápida y proveedor de reportes básicos.

---
*Documentación consolidada y depurada para Guaw & Miaw V3 - Actualizada post-auditoría PWA, Mobile e Inteligencia Artificial Agentic.*
