# Arquitectura y Documentación General - Guaw & Miaw
**Fecha de última actualización:** 15 de Julio de 2026

## 1. Objetivo de la Aplicación
**Guaw & Miaw** es un sistema integral (Fullstack) diseñado para gestionar eficientemente operaciones comerciales (inventario, ventas, cortes de caja, proveedores, gastos y clientes). El objetivo principal es ofrecer una interfaz de usuario extremadamente rápida, fluida y de aspecto premium, respaldada por un backend robusto capaz de manejar la lógica de negocio y la seguridad de los datos.

## 2. Topología de la Arquitectura (Desacoplada)
Para maximizar el rendimiento, minimizar costos (tier gratuito) y evitar las limitaciones de los entornos "Serverless" con Python, el proyecto se dividió en tres capas principales que se comunican a través de Internet:

### A. Capa de Presentación (Frontend)
- **Tecnologías:** React, Vite, TailwindCSS, Zustand (estado), Framer Motion (animaciones).
- **Hosting:** **Vercel**
- **Configuración (Zero-Config):** Vercel detecta Vite automáticamente. Se eliminó el archivo `vercel.json` para evitar conflictos.
- **Variables de Entorno (Vercel):**
  - `VITE_API_URL`: Apunta a la URL de Render (Ej. `https://guaw-miaw-backend.onrender.com/api/v1`). No es secreta.

### B. Capa de Lógica de Negocio (Backend)
- **Tecnologías:** Python, Flask, Flask-SQLAlchemy, JWT-Extended, Gunicorn.
- **Hosting:** **Render.com** (Web Service Gratuito)
- **Configuración de Despliegue:**
  - **Build Command:** `pip install -r requirements.txt`
  - **Start Command:** `gunicorn "backend.app:create_app()"`
  - **Python Version:** Forzado a `3.11.9` vía variable de entorno para evitar tiempos de compilación lentos con Pandas.
- **Variables de Entorno (Render):**
  - `DATABASE_URL`: URL de conexión a Supabase.
  - `SECRET_KEY` y `JWT_SECRET_KEY`: Claves criptográficas generadas por la app.
  - `FLASK_ENV`: `production`
  - `CORS_ORIGINS`: `*`
  - `PYTHON_VERSION`: `3.11.9`

### C. Capa de Persistencia de Datos (Base de Datos)
- **Proveedor:** **Supabase** (PostgreSQL)
- **Configuración de Conexión:**
  - Se utiliza el **Connection Pooler** de Supabase (Puerto `6543`) en modo **Transaction**. Esto previene el agotamiento de conexiones.
  - La URL de conexión en SQLAlchemy requiere el protocolo `postgresql://` (en lugar del obsoleto `postgres://`) y debe llevar el sufijo `?sslmode=require`.

## 3. Seguridad y Autenticación
- La aplicación no utiliza el sistema nativo de autenticación de Supabase. Supabase actúa únicamente como base de datos SQL relacional clásica.
- El login es gestionado por Flask, validando un usuario (ej. `admin`) y un **PIN de 6 dígitos** (ej. `123456`).
- Una vez autenticado, el backend emite un token JWT que el frontend (cliente) almacena y envía en los "headers" de cada petición subsecuente.

## 4. Registro de Despliegue (15 de Julio de 2026)
Durante esta sesión de arquitectura, se resolvieron los siguientes bloqueos críticos:
1. **Migración fuera de Vercel (Backend):** Se abandonaron las *Serverless Functions* de Vercel para Python debido a límites de tamaño e inestabilidad con SQLAlchemy. Se migró exitosamente a Render.
2. **Corrección de Archivos Corruptos:** Se reparó un `requirements.txt` y un `render.yaml` vacíos que impedían la instalación de `gunicorn`.
3. **Resolución de Error 500 (DB Vacía):** Al migrar a producción, la base de datos estaba vacía. Se ejecutó el script `recreate_db.py` remotamente para crear las tablas y sembrar el usuario administrador.
4. **Actualización de PIN:** Se ajustó la contraseña del administrador por defecto de `admin123` a un PIN de 6 dígitos (`123456`) compatible con la interfaz del punto de venta.

## 5. Flujo de Trabajo a Futuro
- **Para hacer cambios en la Web (React):** Modificar código en la carpeta `frontend/`, hacer `git push`. Vercel lo desplegará en ~15 segundos.
- **Para hacer cambios en la API (Python):** Modificar código en `backend/` o raíz, hacer `git push`. Render lo detectará y desplegará en ~2 minutos (gracias al caché de Python 3.11).
