# Guaw & Miaw 2.0 - Guía de Desarrollo Fullstack

Este proyecto ha sido optimizado para calidad, producción y observabilidad.

## 🛠 Entorno de Desarrollo

1. **Backend (Flask):**
   - Asegúrate de tener el entorno virtual activo.
   - Ejecuta: `python run.py`
   - El servidor correrá en `http://127.0.0.1:5000`.

2. **Frontend (Vite):**
   - Navega a `frontend/` y ejecuta: `npm run dev`.
   - Accede a `http://localhost:5173/static/` para desarrollo con HMR y Tailwind.

## 🚀 Preparación para Producción

1. **Compilación de Assets:**
   - En `frontend/`, ejecuta `npm run build`.
   - Esto generará los archivos optimizados en `frontend/static/dist`.

2. **Configuración de Seguridad:**
   - Cambia las claves en el archivo `.env`.
   - El sistema ya integra `Flask-Talisman` para cabeceras de seguridad.

3. **Pruebas de Calidad:**
   - Ejecuta los tests de API: `python -m unittest tests/test_api.py`.

## 📊 Logs y Diagnóstico

- Los logs del servidor se guardan en `logs/guawmiaw.log`.
- Los errores globales del frontend se capturan y muestran en la consola del navegador con un prefijo `[Global Error]`.

## 📁 Estructura de IDs (Armonizada)

- **Header Principal:** `#top-bar`
- **Área de Contenido:** `#content-area`
- **Título Dinámico:** `#dynamic-view-title`
- **Barra de Navegación Contextual:** `#context-nav-slot`
