# 🛠️ Metodología de Trabajo Ideal

Para mantener este proyecto impecable y escalable, sigue este flujo de trabajo recomendado tanto para humanos como para IAs.

---

## 1. Antes de empezar un cambio
- **Analiza el impacto:** Si cambias una clase en `style.css`, verifica que no rompa los modales (`.zen-modal`) o el POS.
- **Respaldo de DB:** Haz una copia manual de `backend/guaw_miaw.db` si vas a tocar los modelos de SQLAlchemy.

## 2. Durante el desarrollo
- **Diseño Zen:** Respeta los márgenes compactos. Si el UI se ve "espacioso", no es Zen.
- **Consistencia de JS:** Los nuevos módulos deben ir en `/frontend/static/js/` y ser importados como módulos ES6 en `app.js`.
- **Manejo de Errores:** Siempre usa bloques `try/catch` en las peticiones `fetch` para mostrar un `alert` o un feedback visual al usuario.

## 3. Al finalizar una sesión
- **Actualiza el Estado:** Indica en el `START_HERE.md` cuál fue el último cambio significativo.
- **Limpieza:** No dejes archivos `.zip`, `.log` viejos o carpetas `__pycache__` en el repositorio principal.
- **Arquitectura:** Si la estructura de carpetas cambió, actualiza la sección "Mapa del Tesoro" en `PROJECT_ARCHITECTURE.md`.

## 4. Para futuras sesiones con IA
Copia y pega este mensaje al iniciar el chat:
> "Hola. Estamos trabajando en el proyecto Guaw & Miaw. Por favor, lee `START_HERE.md` y `PROJECT_ARCHITECTURE.md` antes de proponer cualquier cambio. Mi prioridad es mantener la estética Zen Monochromatic y la integridad de la base de datos."

---
**Recuerda:** Este sistema es una herramienta crítica para el negocio. La estabilidad y la rapidez de uso en el mostrador son lo más importante.
