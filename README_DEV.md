# Guaw & Miaw 2.0 - Guía de Desarrollo Fullstack

Este proyecto ha sido optimizado para calidad, producción y observabilidad.

## 🛠 Entorno de Desarrollo

1. **Backend (Flask):**
   - Asegúrate de tener el entorno virtual activo.
   - Ejecuta: `python run.py` (Asegúrate de NO tener procesos zombie en el puerto 5000).
   - El servidor correrá en `http://127.0.0.1:5000`.

2. **Frontend (Vite / React 19):**
   - Navega a `frontend/` y ejecuta: `npm run dev`.
   - Accede a `http://localhost:5181/` (u otro puerto detectado). El soporte **PWA** inyecta el Service Worker localmente gracias a `devOptions`.

## 🚀 Preparación para Producción

1. **Compilación de Assets (Frontend):**
   - En `frontend/`, ejecuta `npm run build`.
   - Vercel automatiza este proceso; el sistema está preparado para autodespliegue.

2. **Configuración de Backend (Render):**
   - La API se despliega vía `render.yaml` o directamente conectando a GitHub.
   - Variables de Entorno crudas en Render: `DATABASE_URL` (Supabase Postgres), `JWT_SECRET_KEY`.

3. **Pruebas de Calidad y Rendimiento:**
   - Para evaluar el DOM y Main Thread, inspeccionar en Chrome DevTools bajo estrangulamiento de CPU 4x o probar directamente el límite de `visibleCount` en `POS.jsx`.

## 📊 Logs y Diagnóstico

- Los logs del servidor se guardan en `logs/guawmiaw.log`.
- Los errores globales del frontend se capturan y muestran en la consola del navegador con un prefijo `[Global Error]`.

## 📁 Estructura de IDs (Armonizada)

- **Header Principal:** `#top-bar`
- **Área de Contenido:** `#content-area`
- **Título Dinámico:** `#dynamic-view-title`
- **Barra de Navegación Contextual:** `#context-nav-slot`
