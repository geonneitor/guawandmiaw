# 📁 PROYECTO: GUAW & MIAW (LOCAL AME) - VERSIÓN FINAL PARA DESPLIEGUE

Este documento contiene toda la información necesaria para que tú (en una futura sesión) o el servidor (PythonAnywhere) tengan el contexto completo del sistema sin "basura" ni archivos redundantes.

---

## 🛡️ 1. CONTEXTO TÉCNICO (PARA ASISTENTE IA)

Este proyecto es un Sistema de Punto de Venta (POS) y Gestión de Inventario diseñado para una boutique de mascotas.

- **Arquitectura:** Flask (Backend) + Vanilla JS/HTML/CSS (Frontend). 
- **Frontend SPA:** La interfaz principal reside en `frontend/index.html`. Los recursos estáticos (CSS, JS, Imágenes) están en `frontend/static/`.
- **Base de Datos:** SQLite (`backend/guaw_miaw.db`). El backend utiliza Flask-SQLAlchemy para la gestión de modelos (`backend/models/`).
- **Puntos de Entrada (Entry Points):**
    - Local: `python run.py` (Puerto 5000).
    - Despliegue: `wsgi.py` (Lógica automática para PythonAnywhere).

---

## 🚀 2. GUÍA DE DESPLIEGUE EN PYTHONANYWHERE

### A. Preparación en Bash (Consola)
Una vez subido el archivo `LOCAL AME.zip` en `/home/tu_usuario/`, ejecuta el siguiente comando para descomprimir y sobreescribir cualquier versión anterior (si es necesario):

```bash
# Descomprimir y sobreescribir datos existentes
unzip -o "LOCAL AME.zip"
```

### B. Creación del Entorno Virtual (VENV)
Una vez extraído:

```bash
# 2. Navega al directorio (si lo extrajiste en uno específico)
# cd app_guawmiaw 

# 3. Crear el entorno virtual - Versión 3.10 para máxima estabilidad
mkvirtualenv --python=/usr/bin/python3.10 venv_ame

# 2. Actualizar herramientas base e instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt
```

### B. Configuración en el Panel Web
En la pestaña **Web** de PythonAnywhere:

1.  **Source Code:** `/home/tu_usuario/app_guawmiaw`
2.  **Working Directory:** `/home/tu_usuario/app_guawmiaw`
3.  **Virtualenv:** `/home/tu_usuario/.virtualenvs/venv_ame`
4.  **Static Files:**
    - URL: `/static/`
    - Dirección: `/home/tu_usuario/app_guawmiaw/frontend/static`

### C. Configuración del Archivo WSGI
Haz clic en "WSGI configuration file" en el panel de PythonAnywhere y asegúrate de que tenga lo siguiente:

```python
import sys
import os

# Ajusta tu_usuario a tu nombre real en PythonAnywhere
path = '/home/tu_usuario/app_guawmiaw'
if path not in sys.path:
    sys.path.insert(0, path)

os.chdir(path)

from backend.app import create_app
application = create_app()
```

---

## 🔧 3. ACTUALIZACIONES Y MANTENIMIENTO

- **Base de Datos:** Al iniciar la app por primera vez, el código ejecutará `db.create_all()`. Esto garantiza que si la base de datos no existe o le faltan tablas, se creen automáticamente sin errores de "Acceso Denegado".
- **Requerimientos:** Si decides añadir nuevas librerías, actualiza el entorno con `pip freeze > requirements.txt` y vuelve a instalarlas en el servidor.
- **Rutas API:** Todas las rutas del backend están bajo el prefijo `/api/v1/`.

---
*¡Todo está listo para el despegue!* 🚀
