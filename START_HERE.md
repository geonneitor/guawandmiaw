# 🐾 GUAW & MIAW - Punto de Venta Premium

Bienvenido al proyecto **Guaw & Miaw**. Este repositorio contiene el sistema completo de gestión de inventario y punto de venta.

## 🚀 Cómo Iniciar
Para ejecutar la aplicación en tu máquina local:

1. **Instalar Dependencias:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Ejecutar el Servidor:**
   ```bash
   python run.py
   ```
3. **Acceder:**
   Abre tu navegador en [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 📂 Estructura Crítica
- `backend/`: Lógica de Flask y Base de Datos SQLite (`guaw_miaw.db`).
- `frontend/`: Interfaz de usuario "Zen Monochromatic".
- `PROJECT_ARCHITECTURE.md`: **LEER PRIMERO.** Contiene las reglas de diseño y lógica de negocio.
- `GUIA_DESPLIEGUE_PYTHONANYWHERE.md`: Instrucciones para subir a la nube.

## 🧠 Instrucciones para la IA (Si eres un asistente)
1. **Contexto:** Lee siempre `PROJECT_ARCHITECTURE.md` antes de proponer cambios.
2. **Estética:** Mantén el diseño denso y minimalista (Style: Zen). No rompas los bordes redondeados de `12px`.
3. **Base de Datos:** No modifiques el esquema sin crear un respaldo del archivo `.db`.
4. **Respeto al Core:** La lógica de productos pesables (bulk) es delicada. Verifica `pos.js` antes de editar el carrito.

---
**Última actualización:** 13 de Marzo, 2026.
