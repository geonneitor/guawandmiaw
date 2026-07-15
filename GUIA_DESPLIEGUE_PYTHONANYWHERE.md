# 🚀 GUÍA DE DESPLIEGUE - GUAW & MIAW (PYTHONANYWHERE)

Esta guía ha sido optimizada para asegurar un despliegue exitoso en **Python 3.10**, con todas las dependencias (NumPy, Pandas, etc.) ya configuradas para esta versión.

## 1. Subir el Proyecto
Sube el archivo `GUAW AND MIAW VERSION ALPHA.zip` a tu cuenta de PythonAnywhere a través de la pestaña **Files**.

## 2. Consola Bash (Preparación)
Abre una consola Bash en PythonAnywhere y sigue estos pasos exactos:

```bash
# 1. Descomprimir el proyecto
unzip "GUAW AND MIAW VERSION ALPHA.zip" -d app_guawmiaw

# 2. Entrar al directorio
cd app_guawmiaw

# 3. Crear el entorno virtual (VENV) con Python 3.10
# Nota: Si ya tienes uno llamado venv_guaw, bórralo primero con: rmvirtualenv venv_guaw
mkvirtualenv --python=/usr/bin/python3.10 venv_guaw

# 4. Actualizar PIP e instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt
```

> [!IMPORTANT]
> El archivo `requirements.txt` ha sido modificado para usar versiones de **NumPy (2.2.3)**, **Pandas (2.2.3)** y **MarkupSafe (2.1.5)** compatibles con Python 3.10. Esto evita errores de instalación.

## 3. Configuración del Servidor Web
En la pestaña **Web** de PythonAnywhere:

1.  **Source code:** `/home/tu_usuario/app_guawmiaw`
2.  **Working directory:** `/home/tu_usuario/app_guawmiaw`
3.  **Virtualenv:** `/home/tu_usuario/.virtualenvs/venv_guaw`
4.  **Static Files:** Agrega esta ruta:
    - **URL:** `/static/`
    - **Directory:** `/home/tu_usuario/app_guawmiaw/frontend/static`

## 4. Configuración del Archivo WSGI
Haz clic en "WSGI configuration file" y usa este código (reemplazando `tu_usuario`):

```python
import sys
import os

project_home = '/home/tu_usuario/app_guawmiaw'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

os.chdir(project_home)

from backend.app import create_app
application = create_app()
```

## 5. ¡Listo!
Regresa a la pestaña **Web** y presiona **Reload**.

---
**Nota de Diseño:** La aplicación utiliza rutas relativas para garantizar que los estilos y recursos se carguen correctamente en el entorno de producción.
